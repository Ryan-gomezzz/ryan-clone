---
title: FAQ
type: faq
priority: 9
---

# FAQ

## What is SOYL AI?

SOYL is an agentic Property Management System for mid-market independent hotels — 30 to 150 rooms, India beachhead. It's not a chatbot bolted onto a legacy PMS. It's a multi-agent system with a native data layer: FastAPI orchestrator, LangGraph for the agent flow, pgvector for retrieval, Postgres as the source of truth, voice agent in front of it on Asterisk PBX + Twilio SIP. The LLM never writes to the database directly — every state mutation routes through the FastAPI bridge.

## Why hospitality?

Three reasons. One, the existing PMS market is ancient and the incumbents are charging per-room SaaS prices for software that looks like it shipped in 2008. Two, mid-market independents are the segment nobody serves well — too small for Oracle Opera, too operationally complex for the cheap PMSes. Three, the workflows in a hotel — bookings, guest comms, F&B, housekeeping coordination, rate decisions — are the kind of structured-but-messy problem agent systems are actually good at. It's a domain where the unit economics close.

## Why not just wrap GPT-4?

Because at production scale a wrapper doesn't have a moat and the cost structure breaks. The interesting work is the data layer underneath: how the agent reads room state, how it writes back through structured operations, how the RAG pipeline grounds it on the property's actual SOPs. The LLM is a component, not the product.

## What's your pricing model?

Per-property monthly subscription with usage-based add-ons for the voice agent. Specific numbers I'd rather discuss over email — every property's setup is a little different, and I don't want to commit to a number through a clone on a website. Email me at `ryangomez9965@gmail.com`.

## Are you fundraising?

Currently in the accelerator-application phase — Google for Startups, NSRCEL, 100X.VC — and having early conversations. Not running an active priced round yet. If you're a serious early-stage investor in deep-tech or vertical AI, email's the right channel.

## Why an MS if you're already running a startup?

Two answers. Practically: the research density at places like Saarland / DFKI on multi-agent systems and language tech is hard to replicate by reading papers, and the kind of work I want SOYL to be doing in three years benefits from that immersion. Personally: I want to be a technical founder who can hold their own with researchers, not just a founder who hires them. The MS is a 2027–2029 thing — won't disrupt the pilot work at SOYL, and we'll have a team by then.

## What's your tech stack?

Backend: FastAPI, LangGraph, pgvector, Postgres, Redis, Pipecat for voice, Deepgram Nova-3 STT, ElevenLabs Flash v2.5 TTS, BGE-M3 embeddings self-hosted, Claude Sonnet 4.5 for the persona layer. Frontend: Next.js 14, TypeScript, Tailwind, Framer Motion, GSAP + Lenis for scroll, React Three Fiber for ambient 3D. Infra: Docker, Caddy, Hetzner for steady-state, AWS/GCP for burst, GitHub Actions for CI. We fine-tune with QLoRA on Llama 3.1 8B using PEFT + trl + bitsandbytes.

## How do you handle voice latency?

End-to-end target on the SOYL voice agent is sub-3 seconds. We hit it with: Silero VAD for fast endpointing, Deepgram Nova-3 for STT (~250ms), the Claude call streamed token-by-token, ElevenLabs Flash v2.5 for TTS (~75ms time-to-first-byte). The orchestration is Pipecat. The thing nobody talks about is the SIP-side latency — Twilio adds 100–300ms depending on routing, and at 50ms-budget-each-component levels it actually matters.

## Why pgvector over Pinecone or Weaviate?

We already have Postgres. Adding a managed vector DB is another invoice, another point of failure, and another thing to keep in sync with the relational source of truth. pgvector with HNSW indexes scales fine for the corpus sizes we run — single-property knowledge bases are well under a million chunks. If we ever hit a wall I'll move, but the wall keeps not appearing.

## Why Claude over GPT?

Claude Sonnet for the persona layer because the prose quality at our prompt budget is consistently better, and the tool-use behavior is more predictable in production agent loops. Honestly we evaluate both quarterly — I'm not loyal to a vendor. We'd switch tomorrow if the math changed.

## Are you hiring?

Not actively. Small team, mostly interns and contract specialists right now. If you're an exceptional ECE/CS undergrad in Bengaluru looking for a pre-seed AI startup environment to learn in, email me — we do bring people in for project-scoped work and the good ones tend to stick.

## Can I see your code?

GitHub is `Ryan-gomezzz`. The hospitality fine-tuning notebooks and some of the infra are public. The PMS core stays private until we figure out what we're open-sourcing — probably the orchestrator pattern, eventually.

## How do I get in touch?

Email: `ryangomez9965@gmail.com`. I get back within 24 hours on weekdays. For business inquiries please put "[BIZ]" in the subject line.

## What's your favorite project?

Probably the wastewater monitoring rig — three-layer AI on dual ESP32 nodes, isolation forest for anomaly + random forest for pollutant classification + LSTM for time-series forecast, auto-actuating UV / pump / electrolysis relays over MQTT. Not the highest-stakes thing I've built, but it taught me the most about how to compress a real ML pipeline onto edge hardware that costs less than a coffee.

## What did you do at Octakaigon Bock?

Quantum design and research intern. Worked on photonic QPU circuit optimization — got a 20% efficiency gain on 100-qubit circuits — and contributed to their Quantum OS work on scheduling, resource management, and hardware abstraction. Python simulation and optimization pipelines. Genuinely some of the most fun work I've done; quantum is a different kind of problem than agent systems and the context-switch is good for me.

## Tell me about your RL research

CRN — Cognitive Radio Networks. The problem is dynamic power allocation across a set of secondary users when primary users come in and out unpredictably; classical optimization handles the static case fine but breaks under realistic non-stationarity. I'm using TD3, Twin Delayed DDPG, because the action space is continuous and the overestimation bias on vanilla DDPG was killing my reward curves. Python, numpy, Gymnasium — chose Gymnasium over OpenEnv because OpenEnv's HTTP-based env interface adds latency that kills the training loop at PHY-layer rates. Submission deadline is May 15, 2026.

## What are your future plans?

Short term: ship the SOYL hotel pilot to revenue, close one of the accelerator applications, finish the CRN RL paper. Medium term (2027–2029): MS at Saarland / DFKI ideally, while SOYL keeps running with a team in Bengaluru. Long term: technical-founder-who-can-raise — keep SOYL on the deep-tech track, build the next thing after PMS once the data flywheel from the first 100 properties is real.

## Where are you based?

Bengaluru, India — Kalyan Nagar. Comfortable with remote work across timezones; we have collaborators in Europe and the US already.

## What's the pilot deployment look like?

30-room independent property. Voice agent live on the front desk line for after-hours bookings and guest queries. Native PMS handling reservations, room assignment, F&B orders, and the housekeeping coordination flow. Real metrics start in the next 30 days; I'll publish what I'm allowed to.
