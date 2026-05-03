"use client";

import { motion } from "framer-motion";
import { BookOpen, Hammer, Music2 } from "lucide-react";

/**
 * "Currently" widget — what Ryan's reading / building / listening to.
 * Hardcoded for now; eventually pulls from a now.md in the corpus or a
 * lightweight admin endpoint.
 */
const ITEMS = [
  {
    icon: BookOpen,
    label: "reading",
    text: "RL papers — TD3 variants, off-policy actor-critic stability tricks",
  },
  {
    icon: Hammer,
    label: "building",
    text: "SOYL hotel PMS pilot, voice agent latency tuning",
  },
  {
    icon: Music2,
    label: "listening",
    text: "Bonobo · Khruangbin · low-fi house mostly",
  },
];

export function Currently() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="surface p-6"
    >
      <div className="flex items-baseline justify-between mb-5">
        <p className="font-script text-2xl text-accent leading-none">
          Right now —
        </p>
        <p className="eyebrow opacity-60">a snapshot</p>
      </div>
      <div className="space-y-4">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              className="flex items-start gap-3"
            >
              <span className="mt-1 w-7 h-7 shrink-0 rounded-full bg-bg-elev border border-border flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-accent" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="eyebrow mb-0.5">{item.label}</p>
                <p className="text-fg text-sm leading-snug">{item.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="font-script text-base text-fg-muted mt-5 text-right opacity-80">
        — ryan
      </p>
    </motion.div>
  );
}
