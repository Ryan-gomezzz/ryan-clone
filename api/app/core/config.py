"""Centralized config loaded from env. Single source of truth for keys, URLs, tunables."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Identity ────────────────────────────────────────────────────────────
    app_name: str = "ryan-clone-api"
    environment: str = Field(default="development")
    debug: bool = Field(default=False)
    log_level: str = Field(default="INFO")

    # ── HTTP ────────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://ryangomez.dev",
            "https://www.ryangomez.dev",
        ]
    )

    # ── Postgres ────────────────────────────────────────────────────────────
    postgres_dsn: str = Field(
        default="postgresql://ryan:ryan@localhost:5432/ryanclone",
        description="Sync DSN; we use psycopg pool with async wrappers.",
    )
    pgvector_dim: int = 1024  # BGE-M3 dense dim

    # ── Redis ───────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 3600

    # ── Persona LLM ─────────────────────────────────────────────────────────
    # Provider routing: "openai" | "anthropic". Defaults to openai since that's
    # what's wired in prod right now. Either provider key being set is enough
    # to boot the chat path.
    llm_provider: str = Field(default="openai")
    persona_model: str = Field(default="gpt-4o-mini")
    persona_max_tokens: int = 1024
    persona_temperature: float = 0.6
    # Brainstorm mode runs hotter — more pushback, more divergent thinking.
    brainstorm_temperature: float = 0.85
    brainstorm_max_tokens: int = 2048

    anthropic_api_key: str = Field(default="")
    openai_api_key: str = Field(default="")

    # ── Character ───────────────────────────────────────────────────────────
    # The clone's character — Ryan's "inner voice." Swap CHARACTER_NAME without
    # redeploying code; the persona prompt template substitutes it.
    character_name: str = Field(default="Iris")
    character_pronoun_subject: str = Field(default="she")
    character_pronoun_object: str = Field(default="her")
    character_pronoun_possessive: str = Field(default="her")

    # ── Embeddings ──────────────────────────────────────────────────────────
    embedding_model_name: str = "BAAI/bge-m3"
    embedding_cache_dir: str = ".cache/embeddings"
    embedding_device: str = Field(default="cpu", description="cpu | cuda | mps")

    # ── RAG tuning ──────────────────────────────────────────────────────────
    chunk_size_tokens: int = 500
    chunk_overlap_tokens: int = 50
    retrieval_top_k_dense: int = 20
    retrieval_top_k_sparse: int = 10
    retrieval_top_k_final: int = 5
    rrf_k: int = 60

    # ── Voice (Phase 2) ─────────────────────────────────────────────────────
    deepgram_api_key: str = Field(default="")
    elevenlabs_api_key: str = Field(default="")
    elevenlabs_voice_id: str = Field(default="")
    elevenlabs_model: str = "eleven_flash_v2_5"
    voice_enabled: bool = False

    # ── Memory (Phase 3) ────────────────────────────────────────────────────
    mem0_enabled: bool = False

    # ── Rate limiting ───────────────────────────────────────────────────────
    rate_limit_messages: int = 30
    rate_limit_window_seconds: int = 300

    # ── Observability ───────────────────────────────────────────────────────
    sentry_dsn: str = Field(default="")
    posthog_api_key: str = Field(default="")
    posthog_host: str = "https://app.posthog.com"

    # ── Paths ───────────────────────────────────────────────────────────────
    base_dir: Path = Path(__file__).resolve().parent.parent
    knowledge_dir: Path = Path(__file__).resolve().parent.parent / "data" / "knowledge"
    persona_prompt_path: Path = (
        Path(__file__).resolve().parent.parent / "prompts" / "persona.md"
    )

    @model_validator(mode="after")
    def _accept_railway_env(self):
        # Railway injects DATABASE_URL / REDIS_URL — accept those if our
        # explicit names aren't set, and normalize the postgres:// scheme.
        db = os.getenv("DATABASE_URL")
        if db and "POSTGRES_DSN" not in os.environ:
            object.__setattr__(self, "postgres_dsn", db)
        if self.postgres_dsn.startswith("postgres://"):
            object.__setattr__(
                self,
                "postgres_dsn",
                "postgresql://" + self.postgres_dsn[len("postgres://") :],
            )
        rd = os.getenv("REDIS_URL")
        if rd and "REDIS_URL" not in os.environ.get("__pydantic_set_fields", ""):
            # pydantic-settings already loaded REDIS_URL into self.redis_url if set;
            # the os.getenv check covers the case where it was set after import.
            object.__setattr__(self, "redis_url", rd)
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
