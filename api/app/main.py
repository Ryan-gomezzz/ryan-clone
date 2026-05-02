"""FastAPI app entrypoint. Wires routes, lifespan, CORS, observability."""
from __future__ import annotations

from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentry_sdk.integrations.fastapi import FastApiIntegration

from app.core.cache import close_redis, get_redis
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.pool import close_pool, init_db
from app.routes import chat, health, projects, voice

configure_logging()
log = get_logger("main")

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[override]
    log.info("startup_begin", env=settings.environment)
    try:
        await init_db()
    except Exception as exc:
        log.exception("db_init_failed", error=str(exc))
    try:
        await get_redis()
    except Exception as exc:
        log.warning("redis_init_failed", error=str(exc))
    log.info("startup_complete")
    yield
    log.info("shutdown_begin")
    await close_pool()
    await close_redis()
    log.info("shutdown_complete")


app = FastAPI(
    title="Ryan Gomez — Digital Clone",
    description="RAG-grounded persona LLM + voice pipeline. The clone behind ryangomez.dev.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(voice.router)
app.include_router(projects.router)


@app.get("/")
async def root() -> dict:
    return {
        "name": "ryan-clone-api",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/healthz",
    }
