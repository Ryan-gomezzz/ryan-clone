"""Health and metrics endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.core.cache import get_redis
from app.core.config import settings
from app.db.pool import conn_ctx

router = APIRouter(tags=["health"])


@router.get("/healthz")
async def healthz() -> dict:
    db_ok = False
    redis_ok = False
    try:
        async with conn_ctx() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1;")
                await cur.fetchone()
        db_ok = True
    except Exception:
        db_ok = False

    try:
        r = await get_redis()
        await r.ping()
        redis_ok = True
    except Exception:
        redis_ok = False

    return {
        "status": "ok" if (db_ok and redis_ok) else "degraded",
        "db": db_ok,
        "redis": redis_ok,
        "character": settings.character_name,
        "llm_provider": settings.llm_provider,
        "persona_model": settings.persona_model,
        "openai_key_configured": bool(settings.openai_api_key),
        "anthropic_key_configured": bool(settings.anthropic_api_key),
        "voice_enabled": settings.voice_enabled,
        "voice_id_configured": bool(settings.elevenlabs_voice_id),
        "mem0_enabled": settings.mem0_enabled,
        "environment": settings.environment,
    }


@router.get("/metrics")
async def metrics() -> Response:
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
