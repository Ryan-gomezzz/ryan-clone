"""LangGraph orchestration for the persona agent: retrieve → reason → stream.

We keep the graph deliberately small. The persona LLM is the only reasoning node;
the retriever is a tool. The graph exists so we can add memory (Phase 3) and
reranking (Phase 3b) as nodes without rewriting the chat route."""
from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated, TypedDict

from anthropic import AsyncAnthropic
from langgraph.graph import END, StateGraph

from app.core.config import settings
from app.core.logging import get_logger
from app.rag.search import RetrievedChunk, format_context, retrieve

log = get_logger("agents.persona")

_persona_prompt: str | None = None
_anthropic: AsyncAnthropic | None = None


def _load_persona_prompt() -> str:
    global _persona_prompt
    if _persona_prompt is None:
        _persona_prompt = settings.persona_prompt_path.read_text(encoding="utf-8")
    return _persona_prompt


def _get_anthropic() -> AsyncAnthropic:
    global _anthropic
    if _anthropic is None:
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        _anthropic = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic


# ── Graph state ─────────────────────────────────────────────────────────────


class PersonaState(TypedDict, total=False):
    user_message: str
    history: list[dict[str, str]]  # prior turns: [{"role": "user"|"assistant", "content": "..."}]
    retrieved: list[RetrievedChunk]
    context_block: str


# ── Nodes ───────────────────────────────────────────────────────────────────


async def _retrieve_node(state: PersonaState) -> PersonaState:
    chunks = await retrieve(state["user_message"])
    return {
        **state,
        "retrieved": chunks,
        "context_block": format_context(chunks),
    }


# ── Graph compilation ──────────────────────────────────────────────────────


def _build_graph():
    graph = StateGraph(PersonaState)
    graph.add_node("retrieve", _retrieve_node)
    graph.set_entry_point("retrieve")
    graph.add_edge("retrieve", END)
    return graph.compile()


_compiled_graph = None


def _graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = _build_graph()
    return _compiled_graph


# ── Public API ─────────────────────────────────────────────────────────────


async def run_retrieval(user_message: str, history: list[dict[str, str]] | None = None) -> PersonaState:
    initial: PersonaState = {"user_message": user_message, "history": history or []}
    return await _graph().ainvoke(initial)  # type: ignore[return-value]


async def stream_persona_reply(
    user_message: str,
    history: list[dict[str, str]] | None = None,
) -> AsyncIterator[dict]:
    """Yields events: {"type": "context", "doc_ids": [...]} then
    {"type": "delta", "text": "..."} repeatedly, then {"type": "done"}."""
    state = await run_retrieval(user_message, history)
    retrieved: list[RetrievedChunk] = state.get("retrieved", [])
    context_block = state.get("context_block", "")

    yield {
        "type": "context",
        "doc_ids": list({c.doc_id for c in retrieved}),
        "doc_titles": list({c.doc_title for c in retrieved}),
    }

    persona_prompt = _load_persona_prompt()
    user_with_context = (
        user_message
        if not context_block
        else f"{user_message}\n\n{context_block}"
    )

    history = history or []
    messages = [
        *[{"role": h["role"], "content": h["content"]} for h in history if h.get("role") in ("user", "assistant")],
        {"role": "user", "content": user_with_context},
    ]

    client = _get_anthropic()

    full_text_parts: list[str] = []
    async with client.messages.stream(
        model=settings.persona_model,
        max_tokens=settings.persona_max_tokens,
        temperature=settings.persona_temperature,
        system=persona_prompt,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            full_text_parts.append(text)
            yield {"type": "delta", "text": text}

    yield {"type": "done", "full_text": "".join(full_text_parts)}
