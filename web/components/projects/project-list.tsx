"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { fetchProjects, type ProjectMeta } from "@/lib/api";
import { cn } from "@/lib/cn";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ProjectList() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !data?.length) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".project-card");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              once: true,
            },
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="divide-y divide-border"
      onMouseLeave={() => setHoveredSlug(null)}
    >
      {data?.map((p, i) => (
        <ProjectCard
          key={p.slug}
          project={p}
          index={i}
          dimmed={hoveredSlug !== null && hoveredSlug !== p.slug}
          onHover={() => setHoveredSlug(p.slug)}
        />
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pilot: "text-accent",
  production: "text-success",
  in_progress: "text-accent",
  in_implementation: "text-accent",
  ongoing: "text-fg-muted",
  shipped: "text-success",
  prototype: "text-fg-muted",
  hackathon: "text-fg-muted",
};

function ProjectCard({
  project,
  index,
  dimmed,
  onHover,
}: {
  project: ProjectMeta;
  index: number;
  dimmed: boolean;
  onHover: () => void;
}) {
  const statusColor = STATUS_COLORS[project.status] || "text-fg-muted";
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        "block project-card group relative py-10 md:py-14 transition-opacity duration-500",
        dimmed && "opacity-30"
      )}
      onMouseEnter={onHover}
    >
      {/* Sweep line that draws across on hover */}
      <span className="absolute left-0 right-0 bottom-0 h-px bg-accent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out" />

      <article className="grid md:grid-cols-12 md:gap-12 items-start relative">
        <div className="md:col-span-3 mb-4 md:mb-0 flex md:flex-col gap-3 md:gap-1.5 items-baseline md:items-start">
          <motion.span
            className="num-tag text-base inline-block"
            whileHover={{ scale: 1.1 }}
          >
            /{String(index + 1).padStart(2, "0")}
          </motion.span>
          <span className={cn("eyebrow", statusColor)}>
            {project.status.replace("_", " ")}
          </span>
        </div>
        <div className="md:col-span-9">
          <div className="flex items-start justify-between gap-6">
            <h3 className="font-editorial-tight text-3xl md:text-5xl text-fg group-hover:text-accent transition-colors duration-500">
              {project.title}
            </h3>
            <span className="relative inline-flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full border border-border group-hover:border-accent transition-all duration-500 shrink-0 mt-2 overflow-hidden">
              <span className="absolute inset-0 rounded-full bg-accent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-fg-subtle group-hover:text-accent group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-500" />
            </span>
          </div>
          <p className="mt-5 text-fg-muted leading-relaxed max-w-3xl text-[15px] group-hover:text-fg transition-colors duration-500">
            {project.summary}
          </p>
        </div>
      </article>
    </Link>
  );
}
