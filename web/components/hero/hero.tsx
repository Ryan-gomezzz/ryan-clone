"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";

const AmbientScene = dynamic(
  () => import("@/components/scene/ambient-scene").then((m) => m.AmbientScene),
  { ssr: false }
);

export function Hero() {
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
        <span className="eyebrow hidden md:inline">
          Bengaluru, IN · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase()}
        </span>
      </motion.div>

      {/* Main hero block */}
      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-[1400px] w-full mx-auto flex-1 flex flex-col justify-center py-16"
      >
        <motion.p variants={fadeUp} className="eyebrow mb-8">
          <span className="num-tag mr-2">/00</span>
          Founder & CTO, SOYL AI
        </motion.p>

        <motion.h1
          variants={fadeUp}
          className="font-editorial-tight text-[clamp(3.5rem,11vw,10rem)] text-fg max-w-5xl"
        >
          Hey,{" "}
          <span className="italic-display text-accent">I'm Ryan.</span>
          <br />
          <span className="text-fg-muted">A clone of me,</span>
          <br />
          <span className="text-fg-muted">that you can ask</span>
          <br />
          <span className="">anything.</span>
        </motion.h1>

        <motion.div
          variants={fadeUp}
          className="mt-12 grid md:grid-cols-12 gap-8 max-w-5xl"
        >
          <div className="md:col-span-7 text-fg-muted text-base md:text-[17px] leading-relaxed">
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
          </div>

          <div className="md:col-span-5 md:border-l md:border-border md:pl-8 space-y-4">
            <Stat label="Projects shipped" value="12" />
            <Stat label="Pilot rooms live" value="30" />
            <Stat label="Voice latency target" value="<1.5s" />
            <Stat label="Cost per chat" value="~$0.005" />
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#chat"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="relative z-10 max-w-[1400px] w-full mx-auto flex items-center gap-3 text-fg-muted hover:text-accent transition-colors group"
      >
        <span className="eyebrow group-hover:eyebrow-accent">scroll · start chatting</span>
        <span className="flex items-center justify-center w-7 h-7 rounded-full border border-border group-hover:border-accent transition-colors">
          <ArrowDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
        </span>
      </motion.a>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="eyebrow">{label}</span>
      <span className="font-editorial text-2xl text-fg tabular-nums">
        {value}
      </span>
    </div>
  );
}
