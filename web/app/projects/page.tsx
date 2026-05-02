import { ProjectList } from "@/components/projects/project-list";

export const metadata = {
  title: "Work — Ryan Gomez",
  description: "What I've shipped. SOYL AI, voice infra, RL research, edge AI.",
};

export default function ProjectsPage() {
  return (
    <div className="min-h-screen px-6 md:px-10 pt-32 md:pt-40 pb-20 max-w-[1400px] mx-auto">
      <header className="mb-20 md:mb-28 grid md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-8">
          <p className="eyebrow mb-5">
            <span className="num-tag mr-2">/02</span>
            selected work · 2023 — 2026
          </p>
          <h1 className="font-editorial-tight text-5xl md:text-7xl">
            Things <span className="italic-display text-accent">I&apos;ve</span> built.
          </h1>
        </div>
        <div className="md:col-span-4">
          <p className="text-fg-muted leading-relaxed text-[15px]">
            Production systems, hackathon prototypes, research code. Each entry
            is a deep-dive on the architectural decisions, the stack, and what
            was hard.
          </p>
        </div>
      </header>

      <ProjectList />
    </div>
  );
}
