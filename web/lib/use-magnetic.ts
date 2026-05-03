"use client";

import { useEffect, useRef } from "react";

/**
 * Subtly pulls an element toward the cursor when hovered. Used on buttons +
 * key interactive surfaces. Strength controls how much it shifts (0–1).
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.35) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    let active = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onEnter = () => {
      active = true;
      tick();
    };
    const onLeave = () => {
      active = false;
      targetX = 0;
      targetY = 0;
    };
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      targetX = (e.clientX - (rect.left + rect.width / 2)) * strength;
      targetY = (e.clientY - (rect.top + rect.height / 2)) * strength;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      if (active || Math.abs(currentX) > 0.05 || Math.abs(currentY) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        el.style.transform = "";
      }
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("mousemove", onMove);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [strength]);

  return ref;
}
