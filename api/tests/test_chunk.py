"""Smoke tests for the chunker — runs without DB / network."""
from __future__ import annotations

from app.rag.chunk import chunk_markdown


def test_chunk_simple_markdown():
    text = (
        "---\ntitle: Test\ntype: project\n---\n\n"
        "# Heading 1\n\nFirst paragraph here.\n\n"
        "## Heading 2\n\nSecond paragraph.\n\n"
        "Another paragraph after the heading.\n"
    )
    chunks = chunk_markdown(
        doc_id="test", doc_title="Test", doc_type="project", text=text
    )
    assert len(chunks) >= 2
    assert all(c.token_count > 0 for c in chunks)
    assert all(c.content for c in chunks)


def test_chunk_preserves_code_blocks():
    text = (
        "# Stack\n\n"
        "Here is some code:\n\n"
        "```python\nprint('hello')\n```\n\n"
        "And some prose after."
    )
    chunks = chunk_markdown(
        doc_id="test", doc_title="Test", doc_type="project", text=text
    )
    joined = "\n".join(c.content for c in chunks)
    assert "```" in joined
    # Every chunk must have balanced fences (even count of ```).
    for c in chunks:
        assert c.content.count("```") % 2 == 0


def test_chunk_handles_long_content():
    paragraph = "This is a sentence with several words in it. " * 50
    text = f"# Long\n\n" + "\n\n".join([paragraph] * 10)
    chunks = chunk_markdown(
        doc_id="long",
        doc_title="Long",
        doc_type="general",
        text=text,
        target_tokens=200,
        overlap_tokens=20,
    )
    assert len(chunks) > 1
