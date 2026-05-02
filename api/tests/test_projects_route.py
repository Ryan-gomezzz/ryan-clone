"""Verify the project metadata loader picks up the corpus files."""
from __future__ import annotations

from app.routes.projects import _load_projects


def test_load_projects_returns_corpus():
    projects = _load_projects()
    assert len(projects) > 0
    slugs = {p["slug"] for p in projects}
    # canonical projects we expect to always exist
    assert "soyl-pms" in slugs
    assert "soyl-voice-agent" in slugs
    # priority sort: highest first
    priorities = [p["priority"] for p in projects]
    assert priorities == sorted(priorities, reverse=True)
