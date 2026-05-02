"""Project metadata endpoint — backs the scroll-driven gallery on the frontend.

Reads from the same knowledge corpus the RAG layer uses, so the gallery and
the chat can never disagree about what Ryan has shipped."""
from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/projects", tags=["projects"])


def _parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    meta_block = text[3:end].strip()
    body = text[end + 4 :].lstrip("\n")
    meta: dict[str, str] = {}
    for line in meta_block.splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    return meta, body


def _summary(body: str, max_chars: int = 320) -> str:
    """Take the first non-heading paragraph as the summary."""
    paragraphs = [p.strip() for p in body.split("\n\n") if p.strip()]
    for p in paragraphs:
        if not p.startswith("#"):
            cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", p)
            cleaned = re.sub(r"\s+", " ", cleaned).strip()
            if len(cleaned) > max_chars:
                cleaned = cleaned[: max_chars - 1].rstrip() + "…"
            return cleaned
    return ""


@lru_cache(maxsize=1)
def _load_projects() -> list[dict]:
    projects_dir = settings.knowledge_dir / "projects"
    if not projects_dir.exists():
        return []
    out: list[dict] = []
    for path in sorted(projects_dir.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        meta, body = _parse_frontmatter(text)
        slug = path.stem
        out.append(
            {
                "slug": slug,
                "title": meta.get("title", slug),
                "type": meta.get("type", "project"),
                "status": meta.get("status", "unknown"),
                "priority": int(meta.get("priority", "5") or 5),
                "summary": _summary(body),
            }
        )
    out.sort(key=lambda p: -p["priority"])
    return out


@router.get("")
async def list_projects() -> dict:
    return {"projects": _load_projects()}


@router.get("/{slug}")
async def get_project(slug: str) -> dict:
    path = settings.knowledge_dir / "projects" / f"{slug}.md"
    if not path.exists():
        return {"error": "not found"}
    text = path.read_text(encoding="utf-8")
    meta, body = _parse_frontmatter(text)
    return {
        "slug": slug,
        "title": meta.get("title", slug),
        "type": meta.get("type", "project"),
        "status": meta.get("status", "unknown"),
        "priority": int(meta.get("priority", "5") or 5),
        "content": body,
    }
