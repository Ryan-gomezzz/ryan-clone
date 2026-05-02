import type { Variants, Transition } from "framer-motion";

export const ease = [0.2, 0.8, 0.2, 1] as const;

export const easeOut: Transition = {
  duration: 0.6,
  ease: ease as unknown as number[],
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: ease as unknown as number[] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: ease as unknown as number[] },
  },
};

export const stagger = (delay = 0.05): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: delay, delayChildren: 0.05 },
  },
});

export const pageTransition: Variants = {
  initial: { opacity: 0, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: ease as unknown as number[] },
  },
  exit: {
    opacity: 0,
    filter: "blur(6px)",
    transition: { duration: 0.3, ease: ease as unknown as number[] },
  },
};
