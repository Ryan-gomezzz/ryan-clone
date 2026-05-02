import { VoiceCall } from "@/components/voice/voice-call";

export const metadata = {
  title: "Voice — Ryan Gomez",
  description:
    "Talk to Ryan via voice. Sub-1.5s round-trip. Pipecat + Deepgram + ElevenLabs.",
};

export default function VoicePage() {
  return (
    <div className="min-h-screen px-6 md:px-10 pt-32 md:pt-40 pb-20 max-w-[1400px] mx-auto">
      <header className="mb-16 grid md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-8">
          <p className="eyebrow mb-5">
            <span className="num-tag mr-2">/03</span>
            voice · phase 2
          </p>
          <h1 className="font-editorial-tight text-5xl md:text-7xl">
            Call <span className="italic-display text-accent">me.</span>
          </h1>
        </div>
        <div className="md:col-span-4">
          <p className="text-fg-muted leading-relaxed text-[15px]">
            Real-time voice conversation with the clone. Silero VAD →
            Deepgram Nova-3 → RAG-grounded persona → ElevenLabs Flash 2.5.
            End-to-end target sub-1.5 seconds.
          </p>
        </div>
      </header>

      <VoiceCall />
    </div>
  );
}
