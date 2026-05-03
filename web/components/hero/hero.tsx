"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { ArrowDown } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";
import { useMagnetic } from "@/lib/use-magnetic";
import { RevealText } from "@/components/ui/reveal-text";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { LiveStatus } from "@/components/ui/live-status";

const AmbientScene = dynamic(
  () => import("@/components/scene/ambient-scene").then((m) => m.AmbientScene),
  { ssr: false }
);

export function Hero() {
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.3);

  return (
    <section className="relative min-h-[100vh] flex flex-col px-6 md:px-10 pt-32 md:pt-40 pb-12 overflow-hidden">
      <AmbientScene />

      {/* Top metadata strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative z-10 max-w-[1400px] w-full mx-auto flex items-center justify-between mb-auto"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
          </span>
          <span className="eyebrow">Live · v0.1.0</span>
        </div>
        <span className="hidden md:inline">
          <LiveStatus />
        </span>
      </motion.div>

      {/* Main hero block */}
      <div className="relative z-10 max-w-[1400px] w-full mx-auto flex-1 flex flex-col justify-center py-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="eyebrow mb-8"
        >
          <span className="num-tag mr-2">/00</span>
          Founder & CTO, SOYL AI
        </motion.p>

        <h1 className="font-editorial-tight text-[clamp(3.5rem,11vw,10rem)] text-fg max-w-5xl">
          <RevealText text="Hey," initialDelay={0.1} />{" "}
          <span className="italic-display text-accent">
            <RevealText text="I'm Ryan." initialDelay={0.2} />
          </span>
          <br />
          <span className="text-fg-muted">
            <RevealText text="A clone of me," initialDelay={0.5} />
          </span>
          <br />
          <span className="text-fg-muted">
            <RevealText text="that you can ask" initialDelay={0.75} />
          </span>
          <br />
          <RevealText text="anything." initialDelay={1.0} />
        </h1>

        <motion.div
          variants={stagger(0.06)}
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 1.4 }}
          className="mt-12 grid md:grid-cols-12 gap-8 max-w-5xl"
        >
          <motion.div
            variants={fadeUp}
            className="md:col-span-7 text-fg-muted text-base md:text-[17px] leading-relaxed"
          >
            <p>
              I build production multi-agent systems for hospitality —{" "}
              <span className="text-fg">SOYL AI</span> is a hotel PMS with a
              native data layer, currently piloting at a 30-room property.
              ECE undergrad at MSRIT, class of May 2027.
            </p>
            <p className="mt-4">
              This page is a RAG-grounded clone trained on what I&apos;ve
              shipped and how I think about it. It won&apos;t make things up.
              Ask it about the stack, the projects, the long game.
            </p>

            <a
              ref={ctaRef}
              href="#chat"
              className="mt-8 inline-flex items-center gap-3 group"
            >
              <span className="relative inline-flex items-center justify-center w-14 h-14 rounded-full border border-border group-hover:border-accent transition-colors duration-500">
                <span className="absolute inset-0 rounded-full bg-accent opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                <ArrowDown className="w-5 h-5 text-fg-muted group-hover:text-accent group-hover:translate-y-0.5 transition-all duration-500" />
              </span>
              <span className="text-fg group-hover:text-accent transition-colors text-sm font-mono uppercase tracking-[0.2em]">
                start chatting
              </span>
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="md:col-span-5 md:border-l md:border-border md:pl-8 space-y-5"
          >
            <Stat label="Projects shipped" value={12} />
            <Stat label="Pilot rooms live" value={30} />
            <Stat label="Voice round-trip" value="<1.5s" />
            <Stat label="Cost per chat" value="$0.005" prefix />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  prefix,
}: {
  label: string;
  value: string | number;
  prefix?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 group cursor-default">
      <span className="eyebrow group-hover:eyebrow-accent transition-colors duration-300">
        {label}
      </span>
      <span className="font-editorial text-2xl text-fg group-hover:text-accent transition-colors duration-300">
        {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
      </span>
    </div>
  );
}
