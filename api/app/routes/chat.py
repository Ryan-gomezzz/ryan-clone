"""Chat endpoint — POST /chat returns SSE stream of persona reply tokens.

Persists the user message, the assistant's full response, and the retrieved
doc_ids for analytics. Rate-limited per session_id."""
from __future__ import annotations

import json
import time
import uuid
from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from prometheus_client import Counter, Histogram
from pydantic import BaseModel, Field

from app.agents.memory import remember
from app.agents.persona import stream_persona_reply
from app.core.cache import rate_limit
from app.core.config import settings
from app.core.logging import get_logger
from app.db.pool import conn_ctx

log = get_logger("routes.chat")
router = APIRouter(prefix="/chat", tags=["chat"])

CHAT_REQUESTS = Counter("ryan_chat_requests_total", "Chat requests", ["status"])
CHAT_LATENCY = Histogram("ryan_chat_latency_seconds", "Chat end-to-end latency seconds")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str | None = None
    history: list[dict[str, str]] = Field(default_factory=list, max_length=20)


class ContactRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    message: str = Field(min_length=1, max_length=2000)
    session_id: str | None = None


# ── Helpers ────────────────────────────────────────────────────────────────


async def _ensure_session(session_id: str | None, ip_hint: str | None = None) -> str:
    sid = session_id or str(uuid.uuid4())
    async with conn_ctx() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO sessions (id, metadata) VALUES (%s, %s::jsonb)
                ON CONFLICT (id) DO UPDATE SET last_seen_at = NOW();
                """,
                (sid, json.dumps({"ip_hint": ip_hint} if ip_hint else {})),
            )
        await conn.commit()
    return sid


async def _persist_message(
    session_id: str,
    role: str,
    content: str,
    doc_ids: list[str] | None = None,
    latency_ms: int | None = None,
) -> None:
    async with conn_ctx() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO messages (session_id, role, content, retrieved_doc_ids, latency_ms)
                VALUES (%s, %s, %s, %s, %s);
                """,
                (session_id, role, content, doc_ids, latency_ms),
            )
        await conn.commit()


def _sse(event: str | None, data: dict | str) -> bytes:
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    if event:
        return f"event: {event}\ndata: {payload}\n\n".encode("utf-8")
    return f"data: {payload}\n\n".encode("utf-8")


# ── Endpoints ──────────────────────────────────────────────────────────────


@router.post("")
async def chat(req: ChatRequest, request: Request) -> StreamingResponse:
    if not settings.anthropic_api_key:
        CHAT_REQUESTS.labels(status="misconfigured").inc()
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured")

    client_ip = request.client.host if request.client else "unknown"
    rl_id = req.session_id or client_ip
    allowed, remaining = await rate_limit(
        rl_id, settings.rate_limit_messages, settings.rate_limit_window_seconds
    )
    if not allowed:
        CHAT_REQUESTS.labels(status="rate_limited").inc()
        raise HTTPException(status_code=429, detail="rate limited")

    session_id = await _ensure_session(req.session_id, client_ip)
    started = time.perf_counter()

    async def event_stream() -> AsyncIterator[bytes]:
        # send session ID first so the client can persist it
        yield _sse("session", {"session_id": session_id, "remaining": remaining})

        await _persist_message(session_id, "user", req.message)
        await remember(session_id, "user", req.message)

        full_reply_parts: list[str] = []
        doc_ids: list[str] = []

        try:
            async for ev in stream_persona_reply(req.message, history=req.history):
                if ev["type"] == "context":
                    doc_ids = ev.get("doc_ids", [])
                    yield _sse("context", {"doc_ids": doc_ids, "doc_titles": ev.get("doc_titles", [])})
                elif ev["type"] == "delta":
                    full_reply_parts.append(ev["text"])
                    yield _sse("delta", {"text": ev["text"]})
                elif ev["type"] == "done":
                    full_reply_parts = [ev.get("full_text") or "".join(full_reply_parts)]
                    latency_ms = int((time.perf_counter() - started) * 1000)
                    full_text = full_reply_parts[0]
                    await _persist_message(session_id, "assistant", full_text, doc_ids, latency_ms)
                    await remember(session_id, "assistant", full_text)
                    CHAT_REQUESTS.labels(status="ok").inc()
                    CHAT_LATENCY.observe(latency_ms / 1000)
                    yield _sse("done", {"latency_ms": latency_ms})
        except Exception as exc:
            CHAT_REQUESTS.labels(status="error").inc()
            log.exception("chat_stream_failed", error=str(exc), session_id=session_id)
            yield _sse("error", {"detail": "the persona layer hit an error — try again"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/{session_id}/history")
async def get_history(session_id: str) -> dict:
    async with conn_ctx() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT role, content, created_at
                FROM messages
                WHERE session_id = %s
                ORDER BY created_at ASC
                LIMIT 200;
                """,
                (session_id,),
            )
            rows = await cur.fetchall()
    return {
        "session_id": session_id,
        "messages": [
            {"role": r[0], "content": r[1], "created_at": r[2].isoformat()}
            for r in rows
        ],
    }


@router.post("/contact")
async def contact(req: ContactRequest, request: Request) -> dict:
    client_ip = request.client.host if request.client else "unknown"
    allowed, _ = await rate_limit(
        f"contact:{client_ip}", limit=5, window_seconds=3600
    )
    if not allowed:
        raise HTTPException(status_code=429, detail="too many contact attempts")

    sid = await _ensure_session(req.session_id, client_ip)
    async with conn_ctx() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO contact_requests (session_id, email, message)
                VALUES (%s, %s, %s);
                """,
                (sid, req.email, req.message),
            )
        await conn.commit()
    log.info("contact_request_received", session_id=sid, email=req.email)
    return {"ok": True, "message": "got it — Ryan will email back within 24h"}
