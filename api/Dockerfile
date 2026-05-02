# syntax=docker/dockerfile:1.7

FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/app/.cache/hf \
    TRANSFORMERS_CACHE=/app/.cache/hf

WORKDIR /app

# System deps for psycopg, sentence-transformers, torch CPU wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
        ca-certificates \
        git \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first for layer caching.
# Install CPU-only torch wheel before the rest — saves ~5GB on the image vs the
# default CUDA wheels, which we don't need (EMBEDDING_DEVICE=cpu in prod).
COPY pyproject.toml ./
RUN pip install --upgrade pip setuptools wheel \
 && pip install --index-url https://download.pytorch.org/whl/cpu "torch>=2.4.0,<3" \
 && pip install -e .

# Pre-download the embedding model so first request is fast
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3', cache_folder='/app/.cache/hf')" \
    || echo "embedding pre-download failed; will lazy-load at runtime"

# App code
COPY app ./app

EXPOSE 8000

# Use gunicorn + uvicorn workers in prod
CMD ["gunicorn", "app.main:app", \
     "--workers", "2", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
