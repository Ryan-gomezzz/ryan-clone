# Convenience targets for local dev.

.PHONY: help up down api web ingest test lint logs clean

help:
	@echo "Targets:"
	@echo "  make up        - boot Postgres + Redis (dev)"
	@echo "  make down      - stop dev data plane"
	@echo "  make api       - run FastAPI with reload"
	@echo "  make web       - run Next.js dev server"
	@echo "  make ingest    - re-ingest knowledge base"
	@echo "  make test      - run api tests"
	@echo "  make lint      - lint api + web"
	@echo "  make logs      - tail compose logs"
	@echo "  make clean     - drop containers + volumes (destructive)"

up:
	docker compose -f infra/docker-compose.dev.yml up -d

down:
	docker compose -f infra/docker-compose.dev.yml down

api:
	cd api && uvicorn app.main:app --reload --port 8000

web:
	cd web && npm run dev

ingest:
	cd api && python -m app.rag.ingest

test:
	cd api && pytest -q

lint:
	cd api && ruff check app
	cd web && npm run typecheck

logs:
	docker compose -f infra/docker-compose.yml logs -f --tail=200

clean:
	docker compose -f infra/docker-compose.dev.yml down -v
	docker compose -f infra/docker-compose.yml down -v
