"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchProjects, type ProjectMeta } from "@/lib/api";

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
          { opacity: 0, y: 60, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
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
          <div key={i} className="h-40 rounded shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-12 md:space-y-20">
      {data?.map((p, i) => (
        <ProjectCard key={p.slug} project={p} index={i} />
      ))}
    </div>
  );
}

function ProjectCard({ project, index }: { project: ProjectMeta; index: number }) {
  return (
    <Link href={`/projects/${project.slug}`} className="block project-card group">
      <article className="border-t border-border pt-8 md:grid md:grid-cols-12 md:gap-10 hover:border-accent-deep transition-colors">
        <div className="md:col-span-3 mb-4 md:mb-0">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted">
            <span className="text-accent">/{String(index + 1).padStart(2, "0")}</span>
            {"  "}
            {project.status}
          </p>
        </div>
        <div className="md:col-span-9">
          <h3 className="font-editorial-tight text-3xl md:text-5xl text-fg group-hover:text-accent transition-colors">
            {project.title}
          </h3>
          <p className="mt-4 text-fg-muted leading-relaxed max-w-3xl">
            {project.summary}
          </p>
          <motion.span
            className="mt-6 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.3em] text-fg-muted group-hover:text-accent transition-colors"
            whileHover={{ x: 4 }}
          >
            read more →
          </motion.span>
        </div>
      </article>
    </Link>
  );
}
