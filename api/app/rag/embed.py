"""BGE-M3 embedding wrapper. Disk-cached, lazy-loaded so the import is cheap."""
from __future__ import annotations

import hashlib
from pathlib import Path

import diskcache
import numpy as np

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger("rag.embed")

_model = None
_cache: diskcache.Cache | None = None


def _get_cache() -> diskcache.Cache:
    global _cache
    if _cache is None:
        cache_dir = Path(settings.embedding_cache_dir)
        cache_dir.mkdir(parents=True, exist_ok=True)
        _cache = diskcache.Cache(str(cache_dir))
    return _cache


def _get_model():
    """Lazy-load — sentence-transformers + torch is heavy at import time."""
    global _model
    if _model is None:
        log.info("loading_embedding_model", name=settings.embedding_model_name)
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(
            settings.embedding_model_name,
            device=settings.embedding_device,
            cache_folder=str(Path(settings.embedding_cache_dir) / "hf"),
        )
    return _model


def _key(text: str) -> str:
    h = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return f"{settings.embedding_model_name}:{h}"


def embed_one(text: str, *, use_cache: bool = True) -> list[float]:
    if use_cache:
        cache = _get_cache()
        key = _key(text)
        cached = cache.get(key)
        if cached is not None:
            return cached  # type: ignore[return-value]

    model = _get_model()
    vec = model.encode(
        [text],
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    )[0]
    out = vec.astype(np.float32).tolist()

    if use_cache:
        _get_cache().set(_key(text), out)
    return out


def embed_many(texts: list[str], *, use_cache: bool = True) -> list[list[float]]:
    if not texts:
        return []
    out: list[list[float] | None] = [None] * len(texts)
    to_compute: list[tuple[int, str]] = []

    if use_cache:
        cache = _get_cache()
        for i, t in enumerate(texts):
            cached = cache.get(_key(t))
            if cached is not None:
                out[i] = cached  # type: ignore[assignment]
            else:
                to_compute.append((i, t))
    else:
        to_compute = list(enumerate(texts))

    if to_compute:
        model = _get_model()
        batch_texts = [t for _, t in to_compute]
        vecs = model.encode(
            batch_texts,
            normalize_embeddings=True,
            show_progress_bar=False,
            convert_to_numpy=True,
            batch_size=16,
        )
        for (i, t), v in zip(to_compute, vecs):
            arr = v.astype(np.float32).tolist()
            out[i] = arr
            if use_cache:
                _get_cache().set(_key(t), arr)

    return [v for v in out if v is not None]
