"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchCharacter } from "@/lib/api";

/**
 * Persistent floating presence for Iris in the bottom-right.
 * Breathes softly. On hover, expands to a small greeting. On click, scrolls
 * the page to #chat. Disappears when the chat is in view (the chat itself
 * becomes her presence in that moment).
 */
export function IrisPresence() {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);

  const { data: character } = useQuery({
    queryKey: ["character"],
    queryFn: fetchCharacter,
    staleTime: 60_000,
  });
  const name = character?.name ?? "Iris";
  const initial = name.charAt(0).toUpperCase();

  // Hide her when the chat section is in view — she's already present there.
  useEffect(() => {
    const target = document.getElementById("chat");
    if (!target) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.25 }
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.85 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => {
            const el = document.getElementById("chat");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-3 outline-none"
          aria-label={`Talk to ${name}`}
        >
          <AnimatePresence>
            {hovered && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className="bg-bg-elev border border-border px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-[0.15em] text-fg whitespace-nowrap"
              >
                say hi to {name.toLowerCase()}
              </motion.span>
            )}
          </AnimatePresence>

          <motion.span
            animate={{ scale: [1, 1.06, 1], opacity: [0.92, 1, 0.92] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex items-center justify-center w-12 h-12 rounded-full bg-bg-elev border border-border shadow-[0_0_50px_-10px_var(--accent)] group-hover:border-accent transition-colors"
          >
            {/* outer breathing ring */}
            <motion.span
              className="absolute inset-0 rounded-full border border-accent-deep"
              animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
            />
            <span className="font-editorial italic text-2xl text-accent leading-none -mt-0.5">
              {initial}
            </span>
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
