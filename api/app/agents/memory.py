"""Mem0 episodic memory wrapper. Phase 3 — gated behind settings.mem0_enabled.

Until the flag is on, this module is a no-op so the chat path runs without it."""
from __future__ import annotations

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger("agents.memory")

_mem0 = None


def _get_mem0():
    global _mem0
    if _mem0 is None:
        try:
            from mem0 import Memory  # type: ignore[import-untyped]

            _mem0 = Memory()
        except Exception as exc:  # pragma: no cover
            log.warning("mem0_unavailable", error=str(exc))
            return None
    return _mem0


async def remember(session_id: str, role: str, content: str) -> None:
    if not settings.mem0_enabled:
        return
    m = _get_mem0()
    if m is None:
        return
    try:
        m.add(content, user_id=session_id, metadata={"role": role})
    except Exception as exc:
        log.warning("mem0_add_failed", error=str(exc))


async def recall(session_id: str, query: str, k: int = 5) -> list[str]:
    if not settings.mem0_enabled:
        return []
    m = _get_mem0()
    if m is None:
        return []
    try:
        results = m.search(query=query, user_id=session_id, limit=k)
        return [r.get("memory", "") for r in results.get("results", [])]
    except Exception as exc:
        log.warning("mem0_search_failed", error=str(exc))
        return []
