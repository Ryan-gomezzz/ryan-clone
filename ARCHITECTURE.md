# Architecture

## Layering

The system is four concentric layers, top to bottom:

1. **Presentation** — Next.js 14 App Router. Edge-rendered shell, client
   components for everything interactive. SSE consumed via a hand-rolled
   parser in [`web/lib/api.ts`](web/lib/api.ts) (we don't use EventSource
   because it can't POST a body).
2. **Orchestrator** — FastAPI, single process, async throughout. All state
   mutations live here. Routes are thin; the work happens in the agent /
   RAG / voice modules.
3. **Brains** — RAG layer + persona LLM + voice pipeline. These are
   stateless callers; they read from the data layer but never write
   directly.
4. **Data plane** — Postgres + pgvector for the corpus and conversation
   history; Redis for the response cache, rate limit, and (future) session
   store.

The boundary between (2) and (3) matters most: it's the boundary that lets
us swap the persona model, the embedding backend, or the voice provider
without touching the routes or the data schema.

---

## Request paths

### Text chat — POST /chat (SSE)

```
client                  fastapi              langgraph              anthropic
   │                       │                    │                       │
   ├─POST /chat───────────▶│                    │                       │
   │                       │ ensure_session()   │                       │
   │                       │ rate_limit()       │                       │
   │                       │ persist user msg   │                       │
   │                       ├─run_retrieval()──▶│                       │
   │                       │                    │ embed query (cached)  │
   │                       │                    │ pgvector + FTS        │
   │                       │                    │ RRF fusion            │
   │                       │◀─retrieved chunks──│                       │
   │  ◀─event:session──────│                    │                       │
   │  ◀─event:context──────│                    │                       │
   │                       ├─stream Claude──────────────────────────────▶│
   │  ◀─event:delta… ──────│                    │                       │
   │                       │ persist assistant  │                       │
   │  ◀─event:done─────────│ + latency_ms       │                       │
```

### Voice — WS /voice/ws (Phase 2)

```
client ─▶ Caddy ─▶ FastAPI WS upgrade ─▶ Pipecat pipeline:
    Silero VAD → Deepgram Nova-3 STT → PersonaLLMService → ElevenLabs Flash v2.5 → client
```

The `PersonaLLMService` reuses `stream_persona_reply()` so the voice loop and
the text loop produce the *same* prose. Single source of truth for what "Ryan"
sounds like.

---

## RAG

- **Chunking** — markdown-aware, heading-first, then token-budgeted with
  overlap. Code fences are never split mid-block. Implementation:
  [`api/app/rag/chunk.py`](api/app/rag/chunk.py).
- **Embeddings** — BGE-M3 via sentence-transformers, disk-cached so
  re-ingesting unchanged chunks is free. Free, self-hosted, benchmarks fine
  for our corpus size.
- **Storage** — Postgres + pgvector with HNSW (`m=16`, `ef_construction=64`).
  Lexical search uses `to_tsvector('english', content)` + `ts_rank_cd` — not
  true BM25 but plenty for a corpus this small, and it doesn't require
  another extension.
- **Retrieval** — top-20 dense + top-10 lexical → Reciprocal Rank Fusion
  (k=60) → top-5 final. RRF is the right default: parameter-light, robust,
  doesn't need score normalization between two scoring systems that aren't
  directly comparable.
- **Cache** — Redis-keyed on `(query, top_k)` → final ranked chunks, 1h TTL.
  Most visitors ask near-duplicate questions, so the cache hit rate is high.
  LLM responses themselves are not cached because the persona temperature
  (0.6) is intentionally non-zero — variety is part of the persona feel.

---

## Persona prompt

Lives at [`api/app/prompts/persona.md`](api/app/prompts/persona.md). Loaded
once at startup, injected as the `system` parameter on every Claude call.

The prompt has three sections:

- **Voice rules** — casual, direct, technical shorthand; production-level
  specifics; cost-conscious framing; admit work-in-progress; "we" for SOYL,
  "I" for solo work; no LinkedIn-influencer prose.
- **Hard rules** — no fabrication outside the corpus; no phone number; no
  business commitments; off-topic redirects; jailbreak resistance.
- **Format** — short conversational replies by default; expand only when
  the question genuinely needs depth; markdown chrome only when warranted.

Retrieved RAG context is injected inside `<context>...</context>` tags
appended to the user message — kept out of the system prompt so the persona
voice rules retain priority when the model is choosing between conflicting
signals.

---

## Memory (Phase 3)

Mem0 wraps episodic memory across sessions. Gated behind `MEM0_ENABLED`.
Until on, the calls are no-ops so the chat path runs without it. Sessions are
keyed off the chat `session_id` (cookie-persisted in zustand on the client).

---

## Cost model

Per-conversation budget is a hard product constraint — pricing the clone above
$0.05 per voice call breaks the unit economics on a personal portfolio site.
The achieved cost path:

- Text chat: query embedded once (cached after first hit), pgvector + FTS
  query (~5ms), Claude streaming call with ~800 input tokens of context
  + ~200 output tokens. ≈ $0.005.
- Voice: 3 minutes Deepgram Nova-3 @ $0.0043/min ≈ $0.013, 3 minutes
  ElevenLabs Flash v2.5 ≈ $0.030, persona LLM amortized. ≈ $0.05.

If the budget breaks: cache more aggressively, Haiku-route shallow questions,
fallback to F5-TTS self-hosted on the voice path.

---

## Module boundaries (what talks to what)

```
routes/        → agents/, db/, core/cache, core/config
agents/        → rag/, anthropic SDK
rag/           → db/, sentence-transformers (embed), core/cache
voice/         → agents/persona (only the streaming function)
db/            → psycopg pool only
core/          → no app imports
```

A route never imports another route. A brain (`agents/`, `rag/`, `voice/`)
never imports a route. The data plane (`db/`) never imports a brain. This
is the rule that keeps the system testable and refactorable.
