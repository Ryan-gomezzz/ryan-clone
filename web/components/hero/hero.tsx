"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { ArrowDown } from "lucide-react";
import { fadeUp, stagger } from "@/lib/motion";
import { useMagnetic } from "@/lib/use-magnetic";
import { LiveStatus } from "@/components/ui/live-status";

const AmbientScene = dynamic(
  () => import("@/components/scene/ambient-scene").then((m) => m.AmbientScene),
  { ssr: false }
);

export function Hero() {
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.3);

  return (
    <section className="relative min-h-[100vh] flex flex-col px-6 md:px-10 pt-32 md:pt-36 pb-12 overflow-hidden">
      <AmbientScene />

      {/* Top metadata strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative z-10 max-w-[1200px] w-full mx-auto flex items-center justify-between mb-12"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
          </span>
          <span className="eyebrow">a website that talks back</span>
        </div>
        <span className="hidden md:inline">
          <LiveStatus />
        </span>
      </motion.div>

      {/* Letter-style intro */}
      <div className="relative z-10 max-w-[1200px] w-full mx-auto flex-1 grid md:grid-cols-12 gap-10 md:gap-16 py-10 md:py-16">
        {/* Left — the letter */}
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          animate="visible"
          className="md:col-span-8"
        >
          <motion.p
            variants={fadeUp}
            className="font-script text-3xl md:text-4xl text-accent leading-none mb-6"
          >
            Hey,
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="font-editorial-tight text-[clamp(2.4rem,5.5vw,4.5rem)] text-fg leading-[1.05] max-w-3xl"
          >
            I'm Ryan. This isn't really me on the page —{" "}
            <span className="italic-display text-accent">
              it's Iris,
            </span>{" "}
            the part of my thinking that talks. She's read everything I've
            written about my work, and she won't make stuff up. Ask her
            anything.
          </motion.h1>

          <motion.div
            variants={fadeUp}
            className="mt-10 max-w-2xl text-fg-muted text-base md:text-[17px] leading-relaxed space-y-4"
          >
            <p>
              I&apos;m 20, building <span className="text-fg">SOYL AI</span>{" "}
              from Bengaluru — a multi-agent hotel PMS, currently piloting
              at a 30-room property. Final year of ECE at MSRIT. Long game
              is an MS at Saarland in 2027.
            </p>
            <p>
              The clone has two modes:{" "}
              <span className="text-fg">visitor</span> if you&apos;re here
              to ask about me, <span className="text-fg">brainstorm</span>{" "}
              if you&apos;re me and want a thinking partner who pushes back.
              Voice works too — there&apos;s a button on the{" "}
              <a href="/voice" className="text-accent link-underline">
                /voice
              </a>{" "}
              page.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex items-center gap-5"
          >
            <a
              ref={ctaRef}
              href="#chat"
              className="inline-flex items-center gap-3 group bg-accent hover:bg-accent-hot text-bg pl-2 pr-5 py-2 rounded-full transition-all hover:shadow-[0_8px_32px_-12px_var(--accent)]"
            >
              <span className="w-9 h-9 rounded-full bg-bg/20 flex items-center justify-center">
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </span>
              <span className="text-sm font-mono uppercase tracking-[0.18em]">
                talk to iris
              </span>
            </a>

            <span className="font-script text-xl text-fg-muted opacity-70 hidden md:inline">
              ↗ or scroll
            </span>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="font-script text-2xl text-accent mt-12"
          >
            — ryan
          </motion.p>
        </motion.div>

        {/* Right — portrait placeholder + signature */}
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="md:col-span-4 md:pt-2"
        >
          <PortraitCard />

          <div className="mt-6 surface p-5">
            <p className="eyebrow mb-3">where to find me</p>
            <ul className="space-y-2 text-sm">
              <FindMe label="email" value="ryangomez9965@gmail.com" href="mailto:ryangomez9965@gmail.com" />
              <FindMe label="github" value="@Ryan-gomezzz" href="https://github.com/Ryan-gomezzz" external />
              <FindMe label="city" value="Bengaluru, IN" />
              <FindMe label="building" value="SOYL AI" />
            </ul>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}

function FindMe({
  label,
  value,
  href,
  external,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  return (
    <li className="flex items-baseline gap-3">
      <span className="eyebrow w-16 shrink-0">{label}</span>
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-fg link-underline truncate"
        >
          {value}
        </a>
      ) : (
        <span className="text-fg-muted truncate">{value}</span>
      )}
    </li>
  );
}

function PortraitCard() {
  return (
    <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-bg-elev border border-border">
      {/* Placeholder gradient — slot in a real photo at /public/hero_portrait.jpg */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 30%, rgba(224,131,89,0.35), transparent 60%), linear-gradient(135deg, var(--bg-soft), var(--bg-elev))",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <p className="font-editorial italic text-7xl text-accent leading-none mb-3">
          R
        </p>
        <p className="font-script text-lg text-fg-muted">
          a real photo lives here soon
        </p>
      </div>
      {/* Polaroid-style caption */}
      <div className="absolute bottom-0 inset-x-0 px-4 py-3 bg-gradient-to-t from-bg-elev to-transparent">
        <p className="font-script text-base text-fg/80">
          Ryan, Bengaluru, ’26
        </p>
      </div>
    </div>
  );
}
