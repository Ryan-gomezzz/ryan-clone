"use client";

import { useEffect, useRef } from "react";

/**
 * A soft copper glow that follows the cursor across the entire page.
 * Pure CSS gradient on a fixed-position div, position updated via rAF.
 * Native cursor untouched — this is purely atmospheric.
 */
export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      const el = ref.current;
      if (el) {
        el.style.transform = `translate3d(${currentX - 320}px, ${currentY - 320}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[5] w-[640px] h-[640px] rounded-full opacity-50 mix-blend-screen"
      style={{
        background:
          "radial-gradient(circle, rgba(217,119,87,0.10) 0%, rgba(217,119,87,0.04) 40%, transparent 70%)",
        willChange: "transform",
      }}
    />
  );
}
