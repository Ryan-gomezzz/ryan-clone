"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { fadeUp, stagger } from "@/lib/motion";

const AmbientScene = dynamic(
  () => import("@/components/scene/ambient-scene").then((m) => m.AmbientScene),
  { ssr: false }
);

export function Hero() {
  return (
    <section className="relative min-h-[100vh] flex flex-col justify-end px-6 md:px-10 pt-32 pb-12 overflow-hidden">
      <AmbientScene />

      <motion.div
        variants={stagger(0.08)}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl"
      >
        <motion.p
          variants={fadeUp}
          className="font-mono text-xs uppercase tracking-[0.3em] text-fg-muted mb-6"
        >
          digital clone — live
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className="font-editorial-tight text-[clamp(3.5rem,12vw,11rem)] leading-[0.9] text-fg"
        >
          Ryan
          <span className="italic-display text-accent animate-accent-cycle">
            {" "}Gomez
          </span>
        </motion.h1>

        <motion.div
          variants={fadeUp}
          className="mt-8 max-w-2xl text-fg-muted text-base md:text-lg leading-relaxed"
        >
          <p>
            Founder & CTO,{" "}
            <span className="text-fg">SOYL AI</span>. Building production
            multi-agent systems for hospitality. ECE undergrad at MSRIT,
            Bengaluru — class of May 2027.
          </p>
          <p className="mt-4">
            This page is me. A RAG-grounded clone trained on what I&apos;ve built
            and how I think about it. Talk to it — text below, voice on the
            right.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-10 flex items-center gap-4 text-xs font-mono uppercase tracking-[0.2em] text-fg-muted"
        >
          <span className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-subtle-pulse" />
            online
          </span>
          <span className="opacity-40">·</span>
          <span>bengaluru, IN</span>
          <span className="opacity-40">·</span>
          <span>v0.1.0</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
