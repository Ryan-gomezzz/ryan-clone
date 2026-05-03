import { Hero } from "@/components/hero/hero";
import { Chat } from "@/components/chat/chat";
import { ContactGate } from "@/components/ui/contact-gate";
import { Marquee } from "@/components/ui/marquee";
import { LiveStatus } from "@/components/ui/live-status";

const STACK_ITEMS = [
  "FastAPI",
  "LangGraph",
  "pgvector",
  "Claude · GPT",
  "BGE-M3",
  "Pipecat",
  "Deepgram",
  "ElevenLabs",
  "Next.js 14",
  "Framer Motion",
  "GSAP",
  "Three Fiber",
  "Tailwind",
  "Hetzner · Railway",
  "Postgres · Redis",
];

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Marquee — between sections, breathes life into transitions */}
      <section
        className="relative py-8 border-y border-border bg-bg-elev/30 backdrop-blur-sm"
        aria-hidden
      >
        <Marquee items={STACK_ITEMS} speedSec={50} />
      </section>

      <Chat />

      {/* Live status strip */}
      <section className="px-6 md:px-10 py-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-6 px-6 surface">
          <LiveStatus />
          <p className="eyebrow opacity-70">
            voice replies · phase 2 · awaiting cloned voice id
          </p>
        </div>
      </section>

      <section className="relative px-6 md:px-10 py-24 md:py-32 max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16">
          <div className="md:col-span-4">
            <p className="eyebrow mb-4">
              <span className="num-tag mr-2">/04</span>
              contact
            </p>
            <h2 className="font-editorial-tight text-4xl md:text-5xl mb-6">
              Prefer the <span className="italic-display text-accent">long form?</span>
            </h2>
            <p className="text-fg-muted text-[15px] leading-relaxed max-w-sm">
              The clone&apos;s great for quick context. For anything serious —
              business, collaboration, hiring — drop a real email and I&apos;ll
              come back to you personally within 24h.
            </p>
          </div>
          <div className="md:col-span-8">
            <ContactGate />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="px-6 md:px-10 py-12 border-t border-border">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-baseline gap-3">
          <span className="font-editorial text-base text-fg">Ryan Gomez</span>
          <span className="eyebrow opacity-60">© {new Date().getFullYear()} · all rights reserved</span>
        </div>
        <div className="flex gap-8">
          <a
            href="https://github.com/Ryan-gomezzz"
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-sm text-fg-muted"
          >
            github
          </a>
          <a href="/projects" className="link-underline text-sm text-fg-muted">
            work
          </a>
          <a href="/voice" className="link-underline text-sm text-fg-muted">
            voice
          </a>
          <a
            href="mailto:ryangomez9965@gmail.com"
            className="link-underline text-sm text-fg-muted"
          >
            email
          </a>
        </div>
      </div>
      <p className="eyebrow opacity-30 mt-6 text-center md:text-right">
        try the konami code
      </p>
    </footer>
  );
}
