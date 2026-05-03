"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface Props {
  text: string;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

/**
 * Reveals text word-by-word from below a clip mask. Uses Framer's whileInView
 * — fires once when scrolled into view (or immediately if already visible).
 */
export function RevealText({
  text,
  className = "",
  staggerDelay = 0.04,
  initialDelay = 0,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-flex overflow-hidden mr-[0.25em] leading-[1.05]"
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={inView ? { y: 0 } : { y: "110%" }}
            transition={{
              duration: 0.7,
              delay: initialDelay + i * staggerDelay,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
