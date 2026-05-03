"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ChatMode } from "@/lib/store";

const MODES: { id: ChatMode; label: string; sub: string }[] = [
  { id: "visitor", label: "Visitor", sub: "ask about Ryan" },
  { id: "brainstorm", label: "Brainstorm", sub: "Ryan's mode" },
];

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: ChatMode;
  onChange: (m: ChatMode) => void;
}) {
  return (
    <div className="relative inline-flex items-center bg-bg-elev border border-border rounded-full p-1 gap-1">
      {MODES.map((m) => {
        const active = m.id === mode;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={cn(
              "relative px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-[0.15em] transition-colors duration-300 z-10",
              active ? "text-bg" : "text-fg-muted hover:text-fg"
            )}
          >
            {active && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 bg-accent rounded-full -z-10"
                transition={{ type: "spring", stiffness: 280, damping: 26 }}
              />
            )}
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
