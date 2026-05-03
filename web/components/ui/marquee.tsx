"use client";

import { motion } from "framer-motion";

interface Props {
  items: string[];
  speedSec?: number;
  direction?: "left" | "right";
  className?: string;
}

/**
 * Infinite-scrolling marquee. Duplicates the items for a seamless loop.
 */
export function Marquee({
  items,
  speedSec = 40,
  direction = "left",
  className = "",
}: Props) {
  const doubled = [...items, ...items];
  const travel = direction === "left" ? "-50%" : "50%";

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <motion.div
        className="flex gap-12 whitespace-nowrap will-change-transform"
        animate={{ x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{
          duration: speedSec,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="font-editorial text-3xl md:text-5xl text-fg-subtle inline-flex items-center gap-12"
          >
            {item}
            <span className="text-accent text-2xl">✦</span>
          </span>
        ))}
      </motion.div>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-bg to-transparent" />
    </div>
  );
}
