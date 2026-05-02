---
title: SOYL AI Hotel PMS
type: project
priority: 10
status: pilot
---

# SOYL AI Hotel PMS

**Multi-agent Property Management System for mid-market independent hotels (30–150 rooms). India beachhead.**

## Stack

FastAPI + LangGraph orchestration, pgvector + Supabase Postgres for persistence and RAG, Redis for the LLM cache and session store, Asterisk PBX + Twilio SIP for the voice front door, Pipecat for the voice pipeline, Deepgram Nova-3 for STT, ElevenLabs Flash v2.5 for TTS, Claude Sonnet for the persona / reasoning layer, BGE-M3 for embeddings (self-hosted via sentence-transformers), edge inference deployed on AMD Ryzen AI NPUs at the property.

## Architectural decision

The single most important call we made: the LLM never writes to the database directly. Every state mutation — a reservation, a room status change, an F&B order — routes through a typed FastAPI tool that the agent calls. The orchestrator validates the call, executes against Postgres, and returns a structured result. The LLM sees the result and continues reasoning.

This sounds boring but it's the difference between a system you can sell to a hotel GM and a demo. It means: every action is auditable, every action is reversible, the schema stays sane under change, and a hallucinated tool call fails closed instead of corrupting state.

## What was hard

The voice latency budget. Sub-3s end-to-end is non-negotiable for a hotel front desk — anything slower and guests hang up. We get there with Silero VAD for fast endpointing (~50ms), Deepgram Nova-3 STT (~250ms), Claude streaming with the first reasoning token by ~500ms, ElevenLabs Flash v2.5 with ~75ms TTFB, and a Twilio SIP path optimized for a Mumbai PoP. The orchestration code is non-trivial — Pipecat handles a lot of it, but the back-pressure between STT-final and TTS-start is where the wall-clock magic happens.

The other hard piece was the rate-decision RL loop. Static rate cards are wrong; full RL on real-money pricing is irresponsible at pilot scale. We're running it as a recommendation layer the GM approves until the value model is calibrated.

## What shipped

30-room pilot live. Voice agent on the front desk number handling after-hours bookings and guest queries. Native PMS handling reservations, room assignment, F&B order entry, and the housekeeping coordination flow. RAG grounded on the property's SOPs and the brand's response style.

## Differentiator

Native data layer, not computer-use agents. Computer-use as a paradigm doesn't survive contact with a real PMS workflow — the unit economics never close when your agent has to click through someone else's UI for every operation. We built the system as an agent system from day one, with the LLM as a component, not the product.
