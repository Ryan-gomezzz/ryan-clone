"""LangGraph orchestration for the persona agent: retrieve → reason → stream.

The persona LLM is provider-agnostic — wired through a thin LLMClient interface
that both Anthropic Claude and OpenAI GPT models implement. Switch via the
LLM_PROVIDER env var; the rest of the pipeline doesn't care which one is live."""
from __future__ import annotations

from collections.abc import AsyncIterator
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.core.config import settings
from app.core.logging import get_logger
from app.rag.search import RetrievedChunk, format_context, retrieve

log = get_logger("agents.persona")

_persona_prompt: str | None = None
_anthropic = None
_openai = None


def _load_persona_prompt() -> str:
    global _persona_prompt
    if _persona_prompt is None:
        _persona_prompt = settings.persona_prompt_path.read_text(encoding="utf-8")
    return _persona_prompt


# ── Provider clients ───────────────────────────────────────────────────────


def _get_anthropic():
    global _anthropic
    if _anthropic is None:
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        from anthropic import AsyncAnthropic

        _anthropic = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic


def _get_openai():
    global _openai
    if _openai is None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        from openai import AsyncOpenAI

        _openai = AsyncOpenAI(api_key=settings.openai_api_key)
    return _openai


def _resolve_provider() -> str:
    """Pick the active provider. Explicit LLM_PROVIDER wins; otherwise fall
    back to whichever key is set (openai preferred since that's what's wired)."""
    provider = settings.llm_provider.lower().strip()
    if provider == "openai" and settings.openai_api_key:
        return "openai"
    if provider == "anthropic" and settings.anthropic_api_key:
        return "anthropic"
    if settings.openai_api_key:
        return "openai"
    if settings.anthropic_api_key:
        return "anthropic"
    raise RuntimeError("No LLM provider key configured")


# ── Graph state ─────────────────────────────────────────────────────────────


class PersonaState(TypedDict, total=False):
    user_message: str
    history: list[dict[str, str]]  # prior turns: [{"role": "user"|"assistant", "content": "..."}]
    retrieved: list[RetrievedChunk]
    context_block: str


async def _retrieve_node(state: PersonaState) -> PersonaState:
    chunks = await retrieve(state["user_message"])
    return {
        **state,
        "retrieved": chunks,
        "context_block": format_context(chunks),
    }


_compiled_graph = None


def _graph():
    global _compiled_graph
    if _compiled_graph is None:
        graph = StateGraph(PersonaState)
        graph.add_node("retrieve", _retrieve_node)
        graph.set_entry_point("retrieve")
        graph.add_edge("retrieve", END)
        _compiled_graph = graph.compile()
    return _compiled_graph


# ── Public API ─────────────────────────────────────────────────────────────


async def run_retrieval(
    user_message: str, history: list[dict[str, str]] | None = None
) -> PersonaState:
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
        user_message if not context_block else f"{user_message}\n\n{context_block}"
    )

    history = history or []
    provider = _resolve_provider()
    log.info("persona_call", provider=provider, model=settings.persona_model)

    full_text_parts: list[str] = []

    if provider == "openai":
        client = _get_openai()
        messages = [
            {"role": "system", "content": persona_prompt},
            *[
                {"role": h["role"], "content": h["content"]}
                for h in history
                if h.get("role") in ("user", "assistant")
            ],
            {"role": "user", "content": user_with_context},
        ]
        stream = await client.chat.completions.create(
            model=settings.persona_model,
            messages=messages,
            temperature=settings.persona_temperature,
            max_tokens=settings.persona_max_tokens,
            stream=True,
        )
        async for chunk in stream:
            try:
                delta = chunk.choices[0].delta.content
            except (IndexError, AttributeError):
                delta = None
            if delta:
                full_text_parts.append(delta)
                yield {"type": "delta", "text": delta}
    else:
        client = _get_anthropic()
        messages = [
            *[
                {"role": h["role"], "content": h["content"]}
                for h in history
                if h.get("role") in ("user", "assistant")
            ],
            {"role": "user", "content": user_with_context},
        ]
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
