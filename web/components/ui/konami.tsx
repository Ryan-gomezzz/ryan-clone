"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const SEQUENCE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

const MESSAGES = [
  "you found it. now go ship something.",
  "10 cool points. spend them on a real conversation — ryangomez9965@gmail.com",
  "🟧 cheat code accepted. the clone respects you now.",
];

/**
 * Konami code easter egg. On match: toast + flip the accent color for 8s.
 */
export function Konami() {
  useEffect(() => {
    let buf: string[] = [];

    const onKey = (e: KeyboardEvent) => {
      buf = [...buf, e.key].slice(-SEQUENCE.length);
      if (buf.length === SEQUENCE.length && buf.every((k, i) => k === SEQUENCE[i])) {
        const root = document.documentElement;
        const original = root.style.getPropertyValue("--accent") || "";
        root.style.setProperty("--accent", "#7ab8d4");
        root.style.setProperty("--accent-hot", "#9bd0e8");
        toast.success(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
        setTimeout(() => {
          if (original) root.style.setProperty("--accent", original);
          else root.style.removeProperty("--accent");
          root.style.removeProperty("--accent-hot");
        }, 8000);
        buf = [];
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
