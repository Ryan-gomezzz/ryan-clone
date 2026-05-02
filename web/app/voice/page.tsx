import { VoiceCall } from "@/components/voice/voice-call";

export const metadata = {
  title: "Voice — Ryan Gomez",
  description:
    "Talk to Ryan via voice. Sub-1.5s round-trip. Pipecat + Deepgram + ElevenLabs.",
};

export default function VoicePage() {
  return (
    <div className="min-h-screen px-6 md:px-10 pt-32 md:pt-40 pb-20 max-w-4xl mx-auto">
      <header className="mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted mb-4">
          voice · phase 2
        </p>
        <h1 className="font-editorial-tight text-5xl md:text-7xl">
          call <span className="italic-display text-accent">me.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-fg-muted leading-relaxed">
          Real-time voice conversation with the clone. Stack: Silero VAD for
          endpointing, Deepgram Nova-3 for STT, RAG-grounded persona, ElevenLabs
          Flash v2.5 for TTS. End-to-end target sub-1.5 seconds.
        </p>
      </header>

      <VoiceCall />
    </div>
  );
}
