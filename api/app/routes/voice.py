"""Voice route — Phase 2.

GET  /voice/status        → returns whether the pipeline is ready and why not
WS   /voice/ws            → Pipecat-mediated WebRTC/WebSocket session"""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.logging import get_logger
from app.voice.pipecat_pipeline import build_pipeline, voice_ready

log = get_logger("routes.voice")
router = APIRouter(prefix="/voice", tags=["voice"])


@router.get("/status")
async def status() -> dict:
    ready, reason = voice_ready()
    return {"ready": ready, "reason": reason}


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:  # pragma: no cover
    ready, reason = voice_ready()
    if not ready:
        await ws.close(code=1011, reason=reason or "voice not configured")
        return

    await ws.accept()
    try:
        await build_pipeline(ws)
    except WebSocketDisconnect:
        log.info("voice_ws_disconnected")
    except Exception as exc:
        log.exception("voice_pipeline_error", error=str(exc))
        try:
            await ws.close(code=1011)
        except Exception:
            pass
