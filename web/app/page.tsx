import { Hero } from "@/components/hero/hero";
import { Chat } from "@/components/chat/chat";
import { ContactGate } from "@/components/ui/contact-gate";
import { Marquee } from "@/components/ui/marquee";
import { Currently } from "@/components/ui/currently";
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

      {/* Marquee — between sections */}
      <section
        className="relative py-8 border-y border-border bg-bg-elev/30 backdrop-blur-sm"
        aria-hidden
      >
        <Marquee items={STACK_ITEMS} speedSec={50} />
      </section>

      <Chat />

      {/* Currently — what Ryan is doing right now */}
      <section className="px-6 md:px-10 py-20 max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-5">
            <p className="font-script text-3xl text-accent mb-2 leading-none">
              A tiny window —
            </p>
            <h2 className="font-editorial-tight text-4xl md:text-5xl mb-4">
              into the <span className="italic-display text-accent">real</span> me.
            </h2>
            <p className="text-fg-muted text-[15px] leading-relaxed max-w-sm">
              The clone is great for what I&apos;ve shipped. This is what
              I&apos;m up to <em>this week</em>. Updated whenever I remember.
            </p>
            <p className="mt-6 inline-flex">
              <LiveStatus compact />
            </p>
          </div>
          <div className="md:col-span-7">
            <Currently />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="relative px-6 md:px-10 py-24 md:py-28 max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16">
          <div className="md:col-span-5">
            <p className="font-script text-3xl text-accent mb-2 leading-none">
              Or just —
            </p>
            <h2 className="font-editorial-tight text-4xl md:text-5xl mb-4">
              email <span className="italic-display text-accent">me.</span>
            </h2>
            <p className="text-fg-muted text-[15px] leading-relaxed max-w-sm">
              The clone&apos;s great for context. For anything serious — work,
              collaboration, hiring — I&apos;d rather hear from you directly.
              I&apos;ll come back within 24h.
            </p>
          </div>
          <div className="md:col-span-7">
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
    <footer className="px-6 md:px-10 py-16 border-t border-border">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-12">
          <div>
            <p className="font-script text-4xl text-accent mb-3 leading-none">
              thanks for stopping by.
            </p>
            <p className="text-fg-muted text-sm max-w-md leading-relaxed">
              Tell me what you thought — even one line is enough. The clone
              forgets you, but I won&apos;t.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <span className="font-script text-2xl text-fg">— ryan</span>
            <span className="eyebrow opacity-50">
              bengaluru · {new Date().getFullYear()}
            </span>
          </div>
        </div>

        <div className="thin-divider mb-8" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-editorial text-base text-fg">Ryan Gomez</span>
            <span className="eyebrow opacity-50">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-7">
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
        <p className="eyebrow opacity-30 mt-8 text-center md:text-right">
          ↑↑↓↓←→←→ b a
        </p>
      </div>
    </footer>
  );
}
