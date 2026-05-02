"""Redis-backed response cache. Keys are content-hashed; TTL configurable per-call."""
from __future__ import annotations

import hashlib
import json
from typing import Any

import redis.asyncio as redis

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger("cache")

_redis: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_timeout=2.0,
            socket_connect_timeout=2.0,
        )
    return _redis


def make_key(namespace: str, payload: Any) -> str:
    raw = json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    h = hashlib.sha256(raw).hexdigest()[:32]
    return f"ryan:{namespace}:{h}"


async def cache_get(key: str) -> Any | None:
    try:
        r = await get_redis()
        raw = await r.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception as exc:
        log.warning("cache_get_failed", key=key, error=str(exc))
        return None


async def cache_set(key: str, value: Any, ttl: int | None = None) -> None:
    try:
        r = await get_redis()
        await r.set(
            key,
            json.dumps(value, default=str),
            ex=ttl or settings.cache_ttl_seconds,
        )
    except Exception as exc:
        log.warning("cache_set_failed", key=key, error=str(exc))


async def rate_limit(identifier: str, limit: int, window_seconds: int) -> tuple[bool, int]:
    """Sliding-window rate limit. Returns (allowed, remaining)."""
    try:
        r = await get_redis()
        key = f"ryan:rl:{identifier}"
        count = await r.incr(key)
        if count == 1:
            await r.expire(key, window_seconds)
        remaining = max(0, limit - count)
        return count <= limit, remaining
    except Exception as exc:
        log.warning("rate_limit_failed", identifier=identifier, error=str(exc))
        return True, limit  # fail-open


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
