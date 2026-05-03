"""LangGraph orchestration for the persona agent: retrieve → reason → stream.

The persona LLM is provider-agnostic (OpenAI / Anthropic) and mode-aware:
- "visitor"    → Iris speaking on Ryan's behalf to a visitor (default)
- "brainstorm" → Iris speaking *to* Ryan as his thinking partner

The character name is a runtime substitution — change CHARACTER_NAME without
redeploying code."""
from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Literal, TypedDict

from langgraph.graph import END, StateGraph

from app.agents.memory import recall
from app.core.config import settings
from app.core.logging import get_logger
from app.rag.search import RetrievedChunk, format_context, retrieve

log = get_logger("agents.persona")

Mode = Literal["visitor", "brainstorm"]

_visitor_prompt: str | None = None
_brainstorm_prompt: str | None = None
_anthropic = None
_openai = None


def _load_prompt(mode: Mode) -> str:
    global _visitor_prompt, _brainstorm_prompt
    if mode == "brainstorm":
        if _brainstorm_prompt is None:
            path = settings.persona_prompt_path.parent / "inner_voice_brainstorm.md"
            _brainstorm_prompt = path.read_text(encoding="utf-8")
        raw = _brainstorm_prompt
    else:
        if _visitor_prompt is None:
            path = settings.persona_prompt_path.parent / "inner_voice.md"
            _visitor_prompt = path.read_text(encoding="utf-8")
        raw = _visitor_prompt
    return _substitute_character(raw)


def _substitute_character(template: str) -> str:
    return (
        template.replace("{{CHARACTER_NAME}}", settings.character_name)
        .replace("{{CHARACTER_PRONOUN_SUBJECT}}", settings.character_pronoun_subject)
        .replace("{{CHARACTER_PRONOUN_OBJECT}}", settings.character_pronoun_object)
        .replace(
            "{{CHARACTER_PRONOUN_POSSESSIVE}}", settings.character_pronoun_possessive
        )
    )


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
    history: list[dict[str, str]]
    mode: Mode
    session_id: str | None
    retrieved: list[RetrievedChunk]
    context_block: str
    memory_block: str


async def _retrieve_node(state: PersonaState) -> PersonaState:
    chunks = await retrieve(state["user_message"])
    out: PersonaState = {
        **state,
        "retrieved": chunks,
        "context_block": format_context(chunks),
    }
    # Brainstorm mode pulls episodic memory if available
    if state.get("mode") == "brainstorm" and state.get("session_id"):
        memories = await recall(state["session_id"], state["user_message"], k=5)
        if memories:
            joined = "\n".join(f"- {m}" for m in memories if m)
            out["memory_block"] = f"<memory>\n{joined}\n</memory>"
    return out


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
    user_message: str,
    history: list[dict[str, str]] | None = None,
    *,
    mode: Mode = "visitor",
    session_id: str | None = None,
) -> PersonaState:
    initial: PersonaState = {
        "user_message": user_message,
        "history": history or [],
        "mode": mode,
        "session_id": session_id,
    }
    return await _graph().ainvoke(initial)  # type: ignore[return-value]


async def stream_persona_reply(
    user_message: str,
    history: list[dict[str, str]] | None = None,
    *,
    mode: Mode = "visitor",
    session_id: str | None = None,
) -> AsyncIterator[dict]:
    """Yields events: {"type": "context", "doc_ids": [...]} then
    {"type": "delta", "text": "..."} repeatedly, then {"type": "done"}."""
    state = await run_retrieval(
        user_message, history, mode=mode, session_id=session_id
    )
    retrieved: list[RetrievedChunk] = state.get("retrieved", [])
    context_block = state.get("context_block", "")
    memory_block = state.get("memory_block", "")

    yield {
        "type": "context",
        "doc_ids": list({c.doc_id for c in retrieved}),
        "doc_titles": list({c.doc_title for c in retrieved}),
        "memory_count": memory_block.count("\n- ") if memory_block else 0,
    }

    persona_prompt = _load_prompt(mode)
    blocks: list[str] = [user_message]
    if context_block:
        blocks.append(context_block)
    if memory_block:
        blocks.append(memory_block)
    user_with_context = "\n\n".join(blocks)

    history = history or []
    provider = _resolve_provider()

    # Mode-specific generation tuning
    if mode == "brainstorm":
        max_tokens = settings.brainstorm_max_tokens
        temperature = settings.brainstorm_temperature
    else:
        max_tokens = settings.persona_max_tokens
        temperature = settings.persona_temperature

    log.info(
        "persona_call",
        provider=provider,
        model=settings.persona_model,
        mode=mode,
        memory_used=bool(memory_block),
    )

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
            temperature=temperature,
            max_tokens=max_tokens,
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
            max_tokens=max_tokens,
            temperature=temperature,
            system=persona_prompt,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                full_text_parts.append(text)
                yield {"type": "delta", "text": text}

    yield {"type": "done", "full_text": "".join(full_text_parts)}
