"""Voice routes — press-to-talk MVP.

The full streaming Pipecat pipeline is at /voice/ws (kept around for the
streaming-conversational future) but it requires WebRTC + a working Pipecat
1.x transport that matches what the browser sends. The reliable path that
works today is:

    POST /voice/transcribe   — audio blob in, text out (Deepgram)
    POST /voice/synthesize   — text in, mp3 audio out (ElevenLabs)

The frontend orchestrates: record → transcribe → /chat → synthesize → play.
~2s end-to-end, no WebSocket / WebRTC complexity, uses the same persona +
RAG as text chat (single source of truth for what Iris sounds like)."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger("routes.voice")
router = APIRouter(prefix="/voice", tags=["voice"])


# ── Status ─────────────────────────────────────────────────────────────────


def _voice_keys_ready() -> tuple[bool, str | None]:
    if not settings.deepgram_api_key:
        return False, "DEEPGRAM_API_KEY not set"
    if not settings.voice_enabled:
        return False, "VOICE_ENABLED is false"
    provider = (settings.tts_provider or "openai").lower()
    if provider == "openai":
        if not settings.openai_api_key:
            return False, "OPENAI_API_KEY not set (TTS_PROVIDER=openai)"
    elif provider == "elevenlabs":
        if not settings.elevenlabs_api_key:
            return False, "ELEVENLABS_API_KEY not set"
        if not settings.elevenlabs_voice_id:
            return False, "ELEVENLABS_VOICE_ID not set"
    else:
        return False, f"unknown TTS_PROVIDER '{provider}' — use 'openai' or 'elevenlabs'"
    return True, None


@router.get("/status")
async def status() -> dict:
    ready, reason = _voice_keys_ready()
    return {
        "ready": ready,
        "reason": reason,
        "mode": "press-to-talk",
        "tts_provider": settings.tts_provider,
    }


# ── Transcribe (Deepgram) ──────────────────────────────────────────────────


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)) -> dict:
    """Accept an audio blob from the browser, return the transcript.
    Browser sends WebM/Opus by default — Deepgram autodetects the container."""
    ready, reason = _voice_keys_ready()
    if not ready:
        raise HTTPException(status_code=503, detail=reason)

    body = await audio.read()
    if not body:
        raise HTTPException(status_code=400, detail="empty audio body")

    # Deepgram REST: streaming = false, no encoding hint needed for webm/opus
    headers = {
        "Authorization": f"Token {settings.deepgram_api_key}",
        "Content-Type": audio.content_type or "audio/webm",
    }
    params = {
        "model": "nova-3",
        "smart_format": "true",
        "punctuate": "true",
        "language": "en",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.deepgram.com/v1/listen",
                params=params,
                headers=headers,
                content=body,
            )
        if resp.status_code != 200:
            log.warning("deepgram_failed", status=resp.status_code, body=resp.text[:200])
            raise HTTPException(status_code=502, detail=f"deepgram error {resp.status_code}")
        data = resp.json()
        transcript = (
            data.get("results", {})
            .get("channels", [{}])[0]
            .get("alternatives", [{}])[0]
            .get("transcript", "")
        )
        confidence = (
            data.get("results", {})
            .get("channels", [{}])[0]
            .get("alternatives", [{}])[0]
            .get("confidence", 0.0)
        )
        log.info("transcribe_ok", chars=len(transcript), confidence=confidence)
        return {"transcript": transcript, "confidence": confidence}
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("transcribe_failed", error=str(exc))
        raise HTTPException(status_code=502, detail="transcription failed") from exc


# ── Synthesize (provider-routed: OpenAI default, ElevenLabs optional) ─────


class SynthRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


async def _tts_openai(text: str) -> bytes:
    """Hit OpenAI's /v1/audio/speech. Returns the full MP3 bytes."""
    url = "https://api.openai.com/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.openai_tts_model,
        "voice": settings.openai_tts_voice,
        "input": text,
        "response_format": "mp3",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        detail = resp.text[:300] if resp.text else f"openai tts {resp.status_code}"
        log.warning("openai_tts_failed", status=resp.status_code, body=detail)
        raise HTTPException(
            status_code=502, detail=f"openai tts {resp.status_code}: {detail}"
        )
    return resp.content


async def _tts_elevenlabs(text: str) -> bytes:
    """Hit ElevenLabs streaming endpoint. Returns the full MP3 bytes."""
    voice_id = settings.elevenlabs_voice_id
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": settings.elevenlabs_model,
        "voice_settings": {
            "stability": 0.45,
            "similarity_boost": 0.85,
            "style": 0.15,
            "use_speaker_boost": True,
        },
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        detail = resp.text[:300] if resp.text else f"elevenlabs {resp.status_code}"
        log.warning("elevenlabs_failed", status=resp.status_code, body=detail)
        raise HTTPException(
            status_code=502, detail=f"elevenlabs {resp.status_code}: {detail}"
        )
    return resp.content


@router.post("/synthesize")
async def synthesize(req: SynthRequest):
    """Synthesize audio for the given text using the active TTS provider."""
    ready, reason = _voice_keys_ready()
    if not ready:
        raise HTTPException(status_code=503, detail=reason)

    provider = (settings.tts_provider or "openai").lower()
    log.info("tts_call", provider=provider, chars=len(req.text))

    if provider == "elevenlabs":
        audio = await _tts_elevenlabs(req.text)
    else:
        audio = await _tts_openai(req.text)

    async def stream_audio():
        # Send in 8KB chunks so the browser can start decoding earlier.
        CHUNK = 8192
        for i in range(0, len(audio), CHUNK):
            yield audio[i : i + CHUNK]

    return StreamingResponse(
        stream_audio(),
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-cache",
            "Content-Length": str(len(audio)),
            "X-TTS-Provider": provider,
        },
    )


# ── Streaming Pipecat WebSocket (kept for future, currently a no-op) ───────
# The Pipecat 1.x transport/frame protocol changed enough that the previous
# pipeline doesn't work. Disabled until rewritten against SmallWebRTCTransport.


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:  # pragma: no cover
    await ws.accept()
    await ws.send_json({
        "type": "info",
        "message": "streaming voice is offline — use POST /voice/transcribe + /voice/synthesize for press-to-talk",
    })
    try:
        while True:
            msg = await ws.receive_text()
            await ws.send_json({"type": "echo", "received": msg[:64]})
    except WebSocketDisconnect:
        pass
