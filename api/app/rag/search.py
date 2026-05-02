"""Hybrid retrieval: pgvector cosine + Postgres FTS, fused with reciprocal rank.

Reciprocal Rank Fusion (RRF) is the right default — robust, parameter-light, and
doesn't require score normalization between two very different scoring systems."""
from __future__ import annotations

from dataclasses import dataclass

from app.core.cache import cache_get, cache_set, make_key
from app.core.config import settings
from app.core.logging import get_logger
from app.db.pool import conn_ctx
from app.rag.embed import embed_one

log = get_logger("rag.search")


@dataclass
class RetrievedChunk:
    doc_id: str
    doc_title: str
    doc_type: str
    chunk_index: int
    content: str
    score: float


def _vec_literal(vec: list[float]) -> str:
    return "[" + ",".join(f"{v:.6f}" for v in vec) + "]"


async def _dense_search(query_vec: list[float], k: int) -> list[tuple[int, str, str, str, int, str]]:
    sql = """
        SELECT id, doc_id, doc_title, doc_type, chunk_index, content
        FROM chunks
        ORDER BY embedding <=> %s::vector
        LIMIT %s;
    """
    async with conn_ctx() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, (_vec_literal(query_vec), k))
            return await cur.fetchall()


async def _sparse_search(query: str, k: int) -> list[tuple[int, str, str, str, int, str]]:
    # plainto_tsquery is forgiving for free-form input.
    sql = """
        SELECT id, doc_id, doc_title, doc_type, chunk_index, content
        FROM chunks
        WHERE to_tsvector('english', content) @@ plainto_tsquery('english', %s)
        ORDER BY ts_rank_cd(to_tsvector('english', content),
                            plainto_tsquery('english', %s)) DESC
        LIMIT %s;
    """
    async with conn_ctx() as conn:
        async with conn.cursor() as cur:
            await cur.execute(sql, (query, query, k))
            return await cur.fetchall()


def _rrf(ranked_lists: list[list[int]], k_const: int) -> dict[int, float]:
    scores: dict[int, float] = {}
    for ranked in ranked_lists:
        for rank, doc_id in enumerate(ranked):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k_const + rank + 1)
    return scores


async def retrieve(query: str, *, top_k: int | None = None) -> list[RetrievedChunk]:
    if not query.strip():
        return []

    top_k = top_k or settings.retrieval_top_k_final

    cache_key = make_key("rag", {"q": query, "k": top_k})
    cached = await cache_get(cache_key)
    if cached is not None:
        log.debug("rag_cache_hit", q=query[:80])
        return [RetrievedChunk(**c) for c in cached]

    query_vec = embed_one(query)

    dense_rows = await _dense_search(query_vec, settings.retrieval_top_k_dense)
    sparse_rows = await _sparse_search(query, settings.retrieval_top_k_sparse)

    by_id: dict[int, tuple[int, str, str, str, int, str]] = {}
    for row in dense_rows + sparse_rows:
        by_id[row[0]] = row

    rrf_scores = _rrf(
        [
            [r[0] for r in dense_rows],
            [r[0] for r in sparse_rows],
        ],
        settings.rrf_k,
    )

    ranked_ids = sorted(rrf_scores, key=lambda i: rrf_scores[i], reverse=True)[:top_k]

    out = [
        RetrievedChunk(
            doc_id=by_id[i][1],
            doc_title=by_id[i][2],
            doc_type=by_id[i][3],
            chunk_index=by_id[i][4],
            content=by_id[i][5],
            score=rrf_scores[i],
        )
        for i in ranked_ids
    ]

    await cache_set(cache_key, [c.__dict__ for c in out], ttl=settings.cache_ttl_seconds)
    log.info("rag_retrieve", q=query[:80], dense=len(dense_rows), sparse=len(sparse_rows), final=len(out))
    return out


def format_context(chunks: list[RetrievedChunk]) -> str:
    """Pack retrieved chunks into a single <context>...</context> block."""
    if not chunks:
        return ""
    parts = []
    for c in chunks:
        parts.append(f"[{c.doc_title}]\n{c.content}")
    body = "\n\n---\n\n".join(parts)
    return f"<context>\n{body}\n</context>"
