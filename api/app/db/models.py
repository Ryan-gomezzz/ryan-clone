"""Schema layer. Tables are created via init_db() at startup using raw SQL — keeps the
deps light and the migration story trivial for a single-author project. Switch to
Alembic if/when the schema grows."""
from __future__ import annotations

from app.core.config import settings

SCHEMA_SQL = f"""
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Knowledge corpus chunks (RAG) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS chunks (
    id              BIGSERIAL PRIMARY KEY,
    doc_id          TEXT NOT NULL,
    doc_title       TEXT NOT NULL,
    doc_type        TEXT NOT NULL,
    chunk_index     INTEGER NOT NULL,
    content         TEXT NOT NULL,
    token_count     INTEGER NOT NULL,
    embedding       vector({settings.pgvector_dim}) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (doc_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON chunks (doc_id);
CREATE INDEX IF NOT EXISTS idx_chunks_doc_type ON chunks (doc_type);

-- HNSW for cosine similarity. m=16 / ef_construction=64 per spec.
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
    ON chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Tsvector for BM25-ish hybrid search (we use ts_rank_cd as the lexical score;
-- it isn't true BM25 but it's plenty for a corpus this size and avoids pulling
-- in an extra extension).
CREATE INDEX IF NOT EXISTS idx_chunks_content_fts
    ON chunks USING gin (to_tsvector('english', content));

-- ── Sessions (chat) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    visitor_email   TEXT,
    metadata        JSONB NOT NULL DEFAULT '{{}}'::jsonb
);

CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL PRIMARY KEY,
    session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    retrieved_doc_ids TEXT[] DEFAULT NULL,
    latency_ms      INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_created
    ON messages (session_id, created_at);

-- ── Voice transcripts (Phase 2) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_calls (
    id              TEXT PRIMARY KEY,
    session_id      TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    duration_ms     INTEGER,
    transcript      JSONB
);

-- ── Contact requests (email gate) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_requests (
    id              BIGSERIAL PRIMARY KEY,
    session_id      TEXT REFERENCES sessions(id) ON DELETE SET NULL,
    email           TEXT NOT NULL,
    message         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered       BOOLEAN NOT NULL DEFAULT FALSE
);
"""
