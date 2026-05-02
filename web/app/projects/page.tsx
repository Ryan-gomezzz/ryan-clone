import { ProjectList } from "@/components/projects/project-list";

export const metadata = {
  title: "Work — Ryan Gomez",
  description: "What I've shipped. SOYL AI, voice infra, RL research, edge AI.",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen px-6 md:px-10 pt-32 md:pt-40 pb-20 max-w-6xl mx-auto">
      <header className="mb-16 md:mb-24">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted mb-4">
          selected work · 2023 — 2026
        </p>
        <h1 className="font-editorial-tight text-5xl md:text-7xl">
          things <span className="italic-display text-accent">I&apos;ve</span> built.
        </h1>
        <p className="mt-6 max-w-2xl text-fg-muted leading-relaxed">
          Production systems, hackathon prototypes, research code. Each entry
          links to the architectural decisions, the stack, and what was hard.
        </p>
      </header>

      <ProjectList />
    </div>
  );
}
