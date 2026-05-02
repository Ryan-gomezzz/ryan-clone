"""One-shot ingest: read every .md under data/knowledge, chunk, embed, upsert.
Run via `python -m app.rag.ingest` or via the FastAPI startup hook."""
from __future__ import annotations

import asyncio
import re
from pathlib import Path

from app.core.config import settings
from app.core.logging import get_logger
from app.db.pool import conn_ctx, init_db
from app.rag.chunk import Chunk, chunk_markdown
from app.rag.embed import embed_many

log = get_logger("rag.ingest")


def _doc_id(path: Path, root: Path) -> str:
    rel = path.relative_to(root).with_suffix("")
    return str(rel).replace("\\", "/")


def _read_metadata(text: str) -> dict[str, str]:
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    out: dict[str, str] = {}
    for line in text[3:end].strip().splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            out[k.strip()] = v.strip()
    return out


def _title_from_text(text: str, fallback: str) -> str:
    meta = _read_metadata(text)
    if "title" in meta:
        return meta["title"]
    m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    return m.group(1).strip() if m else fallback


def _doc_type(text: str, fallback: str) -> str:
    meta = _read_metadata(text)
    return meta.get("type", fallback)


def _vec_literal(vec: list[float]) -> str:
    """pgvector accepts a string in `[v1,v2,...]` form via text input."""
    return "[" + ",".join(f"{v:.6f}" for v in vec) + "]"


async def ingest_all(*, knowledge_dir: Path | None = None, reset: bool = True) -> int:
    root = knowledge_dir or settings.knowledge_dir
    if not root.exists():
        log.error("knowledge_dir_missing", path=str(root))
        return 0

    await init_db()

    files = sorted(root.rglob("*.md"))
    if not files:
        log.warning("no_markdown_files", path=str(root))
        return 0

    all_chunks: list[Chunk] = []
    for path in files:
        text = path.read_text(encoding="utf-8")
        doc_id = _doc_id(path, root)
        title = _title_from_text(text, doc_id)
        dtype = _doc_type(text, "general")
        chunks = chunk_markdown(
            doc_id=doc_id, doc_title=title, doc_type=dtype, text=text
        )
        log.info(
            "chunked",
            doc=doc_id,
            chunks=len(chunks),
            avg_tokens=sum(c.token_count for c in chunks) // max(1, len(chunks)),
        )
        all_chunks.extend(chunks)

    if not all_chunks:
        log.warning("no_chunks_produced")
        return 0

    log.info("embedding", count=len(all_chunks))
    vectors = embed_many([c.content for c in all_chunks])

    async with conn_ctx() as conn:
        async with conn.cursor() as cur:
            if reset:
                await cur.execute("DELETE FROM chunks;")
            for chunk, vec in zip(all_chunks, vectors):
                await cur.execute(
                    """
                    INSERT INTO chunks
                        (doc_id, doc_title, doc_type, chunk_index,
                         content, token_count, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::vector)
                    ON CONFLICT (doc_id, chunk_index) DO UPDATE SET
                        doc_title  = EXCLUDED.doc_title,
                        doc_type   = EXCLUDED.doc_type,
                        content    = EXCLUDED.content,
                        token_count = EXCLUDED.token_count,
                        embedding  = EXCLUDED.embedding;
                    """,
                    (
                        chunk.doc_id,
                        chunk.doc_title,
                        chunk.doc_type,
                        chunk.chunk_index,
                        chunk.content,
                        chunk.token_count,
                        _vec_literal(vec),
                    ),
                )
        await conn.commit()

    log.info("ingest_complete", chunks=len(all_chunks))
    return len(all_chunks)


if __name__ == "__main__":
    asyncio.run(ingest_all())
