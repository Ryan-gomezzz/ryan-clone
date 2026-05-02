"""Pipecat LLM service that runs through our RAG-grounded persona pipeline.

This wraps `stream_persona_reply` so the voice loop reuses the exact same
retrieval + persona prompt as the text chat. Single source of truth for what
"Ryan" sounds like."""
from __future__ import annotations

from app.core.logging import get_logger

log = get_logger("voice.persona_llm")


class PersonaLLMService:  # pragma: no cover — exercised end-to-end with voice keys
    """Minimal Pipecat-compatible LLM service. We avoid subclassing concrete
    Pipecat classes here so the import doesn't break when pipecat is missing —
    the actual integration is wired up inside build_pipeline()."""

    def __init__(self) -> None:
        self._history: list[dict[str, str]] = []

    async def process_user_text(self, text: str):
        from app.agents.persona import stream_persona_reply

        self._history.append({"role": "user", "content": text})
        full_parts: list[str] = []
        async for ev in stream_persona_reply(text, history=self._history[:-1]):
            if ev["type"] == "delta":
                full_parts.append(ev["text"])
                yield ev["text"]
            elif ev["type"] == "done":
                full_text = ev.get("full_text") or "".join(full_parts)
                self._history.append({"role": "assistant", "content": full_text})
