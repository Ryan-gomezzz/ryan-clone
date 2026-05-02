import { Hero } from "@/components/hero/hero";
import { Chat } from "@/components/chat/chat";
import { ContactGate } from "@/components/ui/contact-gate";

export default function HomePage() {
  return (
    <>
      <Hero />

      <div className="thin-divider mx-6 md:mx-10" />

      <Chat />

      <div className="thin-divider mx-6 md:mx-10" />

      <section className="px-6 md:px-10 py-20 md:py-28 max-w-4xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted mb-3">
          contact
        </p>
        <h2 className="font-editorial-tight text-4xl md:text-6xl mb-10">
          rather <span className="italic-display text-accent">email?</span>
        </h2>
        <ContactGate />
      </section>

      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="px-6 md:px-10 py-12 border-t border-border text-fg-muted text-xs font-mono uppercase tracking-[0.25em]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>© Ryan Gomez · {new Date().getFullYear()}</div>
        <div className="flex gap-6">
          <a
            href="https://github.com/Ryan-gomezzz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors"
          >
            GitHub
          </a>
          <a href="/projects" className="hover:text-accent transition-colors">
            Work
          </a>
          <a href="/voice" className="hover:text-accent transition-colors">
            Voice
          </a>
        </div>
      </div>
    </footer>
  );
}
