#!/usr/bin/env bash
#
# Hetzner CX23 deploy script. Idempotent; safe to re-run.
#
# Usage: scp this file + .env to the box, then `bash hetzner-deploy.sh`.
#
# Assumes a fresh Ubuntu 24.04 box. Will:
#   1. Install Docker + Docker Compose plugin
#   2. Clone the repo (or pull if it exists)
#   3. Boot the stack via docker compose
#   4. Run the RAG ingest one-shot
#   5. Confirm health endpoints

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Ryan-gomezzz/ryan-clone.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/ryan-clone}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"

log()  { printf "\033[0;36m[deploy]\033[0m %s\n" "$*"; }
warn() { printf "\033[0;33m[warn]\033[0m   %s\n" "$*" >&2; }
fail() { printf "\033[0;31m[fail]\033[0m   %s\n" "$*" >&2; exit 1; }

# ── 1. Docker ───────────────────────────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
    log "installing Docker"
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
fi

if ! docker compose version >/dev/null 2>&1; then
    log "installing docker compose plugin"
    apt-get update -y && apt-get install -y docker-compose-plugin
fi

# ── 2. Repo ────────────────────────────────────────────────────────────────
if [ ! -d "$APP_DIR/.git" ]; then
    log "cloning $REPO_URL into $APP_DIR"
    mkdir -p "$(dirname "$APP_DIR")"
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
    log "updating existing checkout at $APP_DIR"
    git -C "$APP_DIR" fetch origin "$BRANCH"
    git -C "$APP_DIR" reset --hard "origin/$BRANCH"
fi

# ── 3. .env sanity check ───────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    warn ".env not found at $ENV_FILE — copying from .env.example"
    cp "$APP_DIR/.env.example" "$ENV_FILE"
    fail "edit $ENV_FILE with real keys, then rerun this script"
fi

# ── 4. Compose up ──────────────────────────────────────────────────────────
cd "$APP_DIR/infra"
log "building + starting containers (this can take a few minutes on first run)"
docker compose --env-file "$ENV_FILE" pull --ignore-pull-failures
docker compose --env-file "$ENV_FILE" build
docker compose --env-file "$ENV_FILE" up -d

# ── 5. RAG ingest (one-shot, idempotent — uses upserts) ────────────────────
log "running RAG ingest"
docker compose --env-file "$ENV_FILE" exec -T api python -m app.rag.ingest \
    || warn "ingest run failed — check logs with: docker compose logs api"

# ── 6. Health probe ────────────────────────────────────────────────────────
log "waiting for healthz"
for i in $(seq 1 30); do
    if curl -fsS http://localhost:8000/healthz >/dev/null 2>&1; then
        log "api healthy after ${i}s"
        break
    fi
    sleep 1
done

curl -s http://localhost:8000/healthz || warn "health probe still failing"

log "deploy complete · open https://${PUBLIC_DOMAIN:-your-domain}"
