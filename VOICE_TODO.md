# VOICE_TODO — Phase 2 setup

The voice pipeline is wired end-to-end in code. To turn it on:

## 1. Record the voice sample (~3 minutes clean audio)

Quiet room. Dynamic mic if you have one, otherwise a decent USB condenser at
arm's length. No music, no fan, no AC hum.

Read the following with **varied prosody** — change cadence between blocks.
ElevenLabs needs the variation to capture intonation, not just timbre.

### Block 1 — stack descriptions (read like you're explaining to a colleague)

> So SOYL PMS is FastAPI plus LangGraph for the orchestration, pgvector and
> Supabase Postgres for the data layer, Redis for the LLM cache, Pipecat for
> the voice pipeline, Deepgram Nova-3 for STT and ElevenLabs Flash 2.5 for TTS.
> Persona layer is Claude Sonnet, embeddings are BGE-M3 self-hosted. The whole
> thing runs sub three seconds end to end on a Twilio SIP path.

> The CRN RL project is TD3 — Twin Delayed DDPG — for dynamic power allocation
> in cognitive radio networks. Continuous action space, semi-Markov primary
> user model, reward shaping is the part that took the longest to get right.
> Submission deadline is May 15, 2026.

> Hush Gentle is the skincare e-commerce build. Next 16, React 18, Supabase
> with row-level security on every table, Cashfree for payments, Resend for
> transactional email, deployed on Vercel. The interesting part is the
> webhook idempotency layer — Indian payment processing has more edge cases
> than the US.

### Block 2 — personal anecdote (slower, more reflective)

> I started SOYL because every hotel PMS I looked at was either ancient,
> generic, or a thin wrapper over a chatbot. The interesting opportunity
> wasn't to bolt an LLM onto a PMS, it was to build the PMS as an agent
> system from day one. Native data layer, strict module boundaries, the LLM
> never writes to Postgres directly. That's the architectural commitment
> that makes everything else work.

### Block 3 — numerical strings (clear, deliberate)

> 30 rooms in the pilot. Sub 900 milliseconds end to end. 100 qubit photonic
> circuits. 20 percent efficiency gain. Class of May 2027. GPA 7.58 out of 10.
> Phone number 7022509965. Email ryangomez9965 at gmail dot com.

### Block 4 — short conversational lines (loose, casual)

> Yeah, that's right.
> Not yet — pilot's still ramping.
> We're seeing decent numbers but it's early.
> Email's the right channel for that.
> I haven't shipped that one.
> Probably not what you're here for.

---

## 2. Clone the voice on ElevenLabs

1. ElevenLabs → Voice Lab → Add Voice → Instant Voice Clone (or Professional
   if you go through the longer recording).
2. Upload the WAV / MP3 from step 1.
3. Name it `Ryan Gomez`.
4. Copy the resulting voice ID.

---

## 3. Wire keys into the env

In your `.env`:

```bash
VOICE_ENABLED=true
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...        # the ID from step 2
ELEVENLABS_MODEL=eleven_flash_v2_5
```

Restart the API. `GET /voice/status` should now return `{"ready": true}`.

---

## 4. Test the call

Open `/voice` in the browser, hit "start call". Check:

- p50 round-trip latency under 1.5 seconds.
- No crashes over a 10-minute call.
- Transcript saves to the `voice_calls` table.
- Voice sounds like Ryan, not generic.

If the voice is off, re-record block 1 with a different mic placement and
re-clone. The single biggest variable is the source recording quality, not
ElevenLabs settings.

---

## 5. Production transport

The bundled WebSocket transport is fine for direct browser → API. If you
want a hosted SFU (lower jitter, NAT traversal, multi-listener), swap the
`WebsocketServerTransport` in `api/app/voice/pipecat_pipeline.py` for
`LiveKitTransport` and add the LiveKit room config. Pipecat supports both
without changes elsewhere in the pipeline.
