---
title: SOYL AI Voice Agent Platform
type: project
priority: 9
status: production
---

# SOYL AI Voice Agent Platform

**Sub-900ms end-to-end voice latency platform — the voice layer that sits in front of the SOYL PMS and other vertical deployments.**

## Stack

FastAPI + WebSockets for signaling and event transport, AWS + GCP for the containerized microservices (we burst across providers based on regional latency), Pipecat for pipeline orchestration, Deepgram Nova-3 for STT, ElevenLabs Flash v2.5 for TTS, silero-vad for endpointing, Redis for session state, horizontal scaling on Kubernetes for the worker pool.

## Architectural decision

We separated the **transport** (WebRTC / SIP signaling, RTP), the **pipeline** (VAD → STT → orchestrator → TTS), and the **brain** (the application-specific agent logic) into three deployments. That means the same voice infra serves the hotel PMS, hospitality concierge work, and any other vertical we point it at — only the brain swaps. This is what lets us amortize the latency-engineering work across products.

## What was hard

Getting the 99th-percentile latency down. p50 sub-900ms is a tractable engineering problem; p99 is where you find out which of your dependencies actually has tail latency. Deepgram is rock-solid, ElevenLabs has the occasional 800ms TTFB hiccup we bypass with a fallback, and the Twilio SIP path varies by 200ms depending on which carrier the call originated on.

## What shipped

The platform is in production behind the SOYL PMS pilot and a few smaller deployments. Horizontal scaling tested up to ~200 concurrent calls before we cap on the LLM provider's rate limits.

## Why we built it

Off-the-shelf voice agent platforms either have unacceptable latency, lock you into a single LLM, or charge per-minute rates that don't close at vertical-AI margins. Building the layer ourselves gives us the latency, the model flexibility, and the cost structure we need.
