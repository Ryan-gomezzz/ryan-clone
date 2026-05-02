"""Async psycopg connection pool. Single global pool, lazy-initialized."""
from __future__ import annotations

from contextlib import asynccontextmanager

from psycopg_pool import AsyncConnectionPool

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models import SCHEMA_SQL

log = get_logger("db")

_pool: AsyncConnectionPool | None = None


async def get_pool() -> AsyncConnectionPool:
    global _pool
    if _pool is None:
        _pool = AsyncConnectionPool(
            conninfo=settings.postgres_dsn,
            min_size=2,
            max_size=10,
            open=False,
            kwargs={"autocommit": False},
        )
        await _pool.open()
    return _pool


async def init_db() -> None:
    """Apply schema. Idempotent — uses CREATE ... IF NOT EXISTS throughout."""
    pool = await get_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(SCHEMA_SQL)
        await conn.commit()
    log.info("db_initialized")


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def conn_ctx():
    pool = await get_pool()
    async with pool.connection() as conn:
        yield conn
