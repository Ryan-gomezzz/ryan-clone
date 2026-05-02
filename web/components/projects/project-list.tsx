"use client";

import { useEffect, useRef } from "react";
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
    <div ref={containerRef} className="divide-y divide-border">
      {data?.map((p, i) => (
        <ProjectCard key={p.slug} project={p} index={i} />
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

function ProjectCard({ project, index }: { project: ProjectMeta; index: number }) {
  const statusColor = STATUS_COLORS[project.status] || "text-fg-muted";
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block project-card group py-10 md:py-14 transition-colors"
    >
      <article className="grid md:grid-cols-12 md:gap-12 items-start">
        <div className="md:col-span-3 mb-4 md:mb-0 flex md:flex-col gap-3 md:gap-1.5 items-baseline md:items-start">
          <span className="num-tag text-base">/{String(index + 1).padStart(2, "0")}</span>
          <span className={cn("eyebrow", statusColor)}>{project.status.replace("_", " ")}</span>
        </div>
        <div className="md:col-span-9">
          <div className="flex items-start justify-between gap-6">
            <h3 className="font-editorial-tight text-3xl md:text-5xl text-fg group-hover:text-accent transition-colors duration-500">
              {project.title}
            </h3>
            <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-fg-subtle group-hover:text-accent group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-500 shrink-0 mt-2" />
          </div>
          <p className="mt-5 text-fg-muted leading-relaxed max-w-3xl text-[15px]">
            {project.summary}
          </p>
        </div>
      </article>
    </Link>
  );
}
