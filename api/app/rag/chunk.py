"""Chunking. Markdown-aware: splits on heading boundaries first, then tokens.
Never splits inside a fenced code block."""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.core.config import settings

# Approximate token count: 1 token ≈ 4 chars for English. Cheap, deterministic,
# and we don't need exactness here — chunk size is a tunable not a contract.
_CHARS_PER_TOKEN = 4

_HEADING_RE = re.compile(r"^(#{1,6})\s+", re.MULTILINE)
_CODE_FENCE_RE = re.compile(r"```")


@dataclass
class Chunk:
    doc_id: str
    doc_title: str
    doc_type: str
    chunk_index: int
    content: str
    token_count: int


def _approx_tokens(text: str) -> int:
    return max(1, len(text) // _CHARS_PER_TOKEN)


def _strip_frontmatter(text: str) -> tuple[str, dict[str, str]]:
    if not text.startswith("---"):
        return text, {}
    end = text.find("\n---", 3)
    if end == -1:
        return text, {}
    fm_block = text[3:end].strip()
    body = text[end + 4 :].lstrip("\n")
    meta: dict[str, str] = {}
    for line in fm_block.splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    return body, meta


def _split_on_headings(text: str) -> list[str]:
    """Split markdown by H1/H2 headings, preserving the heading on each section."""
    # find heading positions
    positions = [m.start() for m in _HEADING_RE.finditer(text)]
    if not positions or positions[0] != 0:
        positions = [0] + positions
    sections: list[str] = []
    for i, start in enumerate(positions):
        end = positions[i + 1] if i + 1 < len(positions) else len(text)
        s = text[start:end].strip()
        if s:
            sections.append(s)
    return sections


def _balance_code_fences(s: str) -> str:
    """If a section ends mid-fence, close it. Cheap safety, avoids broken markdown."""
    fences = _CODE_FENCE_RE.findall(s)
    if len(fences) % 2 == 1:
        return s + "\n```"
    return s


def _split_by_size(section: str, target_tokens: int, overlap_tokens: int) -> list[str]:
    """Split an over-long section by paragraphs, with rough token budget + overlap.
    Skips paragraphs that fall inside open code fences."""
    if _approx_tokens(section) <= target_tokens:
        return [section]

    paragraphs = section.split("\n\n")
    chunks: list[str] = []
    current: list[str] = []
    current_tokens = 0
    in_code = False

    target_chars = target_tokens * _CHARS_PER_TOKEN
    overlap_chars = overlap_tokens * _CHARS_PER_TOKEN

    for p in paragraphs:
        ptoks = _approx_tokens(p)
        # track code-fence parity through this paragraph
        fence_count = p.count("```")
        if fence_count % 2 == 1:
            in_code = not in_code

        if current_tokens + ptoks > target_tokens and current and not in_code:
            joined = "\n\n".join(current)
            chunks.append(_balance_code_fences(joined))
            # carry over the tail for overlap
            tail = joined[-overlap_chars:] if overlap_chars else ""
            current = [tail, p] if tail else [p]
            current_tokens = _approx_tokens("\n\n".join(current))
        else:
            current.append(p)
            current_tokens += ptoks

    if current:
        chunks.append(_balance_code_fences("\n\n".join(current)))

    # last-resort hard split for any chunk still too long
    final: list[str] = []
    for c in chunks:
        if len(c) <= target_chars * 1.5:
            final.append(c)
            continue
        for i in range(0, len(c), target_chars):
            final.append(_balance_code_fences(c[i : i + target_chars]))
    return final


def chunk_markdown(
    *,
    doc_id: str,
    doc_title: str,
    doc_type: str,
    text: str,
    target_tokens: int | None = None,
    overlap_tokens: int | None = None,
) -> list[Chunk]:
    target = target_tokens or settings.chunk_size_tokens
    overlap = overlap_tokens or settings.chunk_overlap_tokens

    body, _meta = _strip_frontmatter(text)
    sections = _split_on_headings(body)

    pieces: list[str] = []
    for sec in sections:
        pieces.extend(_split_by_size(sec, target, overlap))

    chunks: list[Chunk] = []
    for i, piece in enumerate(pieces):
        piece = piece.strip()
        if not piece:
            continue
        chunks.append(
            Chunk(
                doc_id=doc_id,
                doc_title=doc_title,
                doc_type=doc_type,
                chunk_index=i,
                content=piece,
                token_count=_approx_tokens(piece),
            )
        )
    return chunks
