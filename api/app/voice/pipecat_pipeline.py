"""Pipecat voice pipeline — Phase 2.

Stack: Silero VAD → Deepgram Nova-3 STT → persona LLM (RAG-grounded) → ElevenLabs
Flash v2.5 TTS. Wired through Pipecat's WebSocket transport so the browser can
join via the /voice/ws endpoint.

Gated behind settings.voice_enabled — until the keys + voice ID are present,
this module is a no-op and the route returns a friendly 503."""
from __future__ import annotations

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger("voice.pipeline")


def voice_ready() -> tuple[bool, str | None]:
    """Returns (ready, reason_if_not). Used by the route to fail fast."""
    if not settings.voice_enabled:
        return False, "voice pipeline is disabled — set VOICE_ENABLED=true and provide keys"
    if not settings.deepgram_api_key:
        return False, "DEEPGRAM_API_KEY not set"
    if not settings.elevenlabs_api_key:
        return False, "ELEVENLABS_API_KEY not set"
    if not settings.elevenlabs_voice_id:
        return False, "ELEVENLABS_VOICE_ID not set — clone Ryan's voice first (see VOICE_TODO.md)"
    if not settings.anthropic_api_key:
        return False, "ANTHROPIC_API_KEY not set"
    return True, None


async def build_pipeline(websocket):  # pragma: no cover — needs voice keys to test
    """Construct and run the Pipecat pipeline against an open WebSocket.

    Implementation note: Pipecat's transport / processor APIs evolve between
    minor versions. We build the pipeline lazily and import inside the function
    so the rest of the app boots even when pipecat-ai is not installed."""
    ready, reason = voice_ready()
    if not ready:
        raise RuntimeError(reason)

    from pipecat.frames.frames import LLMMessagesFrame
    from pipecat.pipeline.pipeline import Pipeline
    from pipecat.pipeline.runner import PipelineRunner
    from pipecat.pipeline.task import PipelineParams, PipelineTask
    from pipecat.processors.aggregators.llm_response import (
        LLMAssistantResponseAggregator,
        LLMUserResponseAggregator,
    )
    from pipecat.services.deepgram import DeepgramSTTService
    from pipecat.services.elevenlabs import ElevenLabsTTSService
    from pipecat.transports.network.websocket_server import (
        WebsocketServerParams,
        WebsocketServerTransport,
    )
    from pipecat.vad.silero import SileroVADAnalyzer

    from app.voice.persona_llm_service import PersonaLLMService

    transport = WebsocketServerTransport(
        params=WebsocketServerParams(
            audio_out_enabled=True,
            add_wav_header=False,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
        ),
        websocket=websocket,
    )

    stt = DeepgramSTTService(api_key=settings.deepgram_api_key)
    tts = ElevenLabsTTSService(
        api_key=settings.elevenlabs_api_key,
        voice_id=settings.elevenlabs_voice_id,
        model=settings.elevenlabs_model,
    )
    llm = PersonaLLMService()

    user_agg = LLMUserResponseAggregator()
    assistant_agg = LLMAssistantResponseAggregator()

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            user_agg,
            llm,
            tts,
            transport.output(),
            assistant_agg,
        ]
    )

    task = PipelineTask(
        pipeline,
        PipelineParams(allow_interruptions=True),
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(_t, _client):
        log.info("voice_client_connected")
        # Kick off with a greeting so the user knows the line is live.
        greeting = "Yo, you've reached Ryan — well, the clone. What's up?"
        await task.queue_frames([LLMMessagesFrame([{"role": "assistant", "content": greeting}])])

    runner = PipelineRunner()
    await runner.run(task)
