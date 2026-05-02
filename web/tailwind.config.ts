import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-elev": "var(--bg-elev)",
        fg: "var(--fg)",
        "fg-muted": "var(--fg-muted)",
        accent: "var(--accent)",
        "accent-hot": "var(--accent-hot)",
        "accent-deep": "var(--accent-deep)",
        border: "var(--border)",
        danger: "var(--danger)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      animation: {
        "accent-cycle": "accentCycle 8s ease-in-out infinite",
        "subtle-pulse": "subtlePulse 3s ease-in-out infinite",
        "grain-shift": "grainShift 8s steps(8) infinite",
      },
      keyframes: {
        accentCycle: {
          "0%, 100%": { color: "var(--fg)" },
          "50%": { color: "var(--accent)" },
        },
        subtlePulse: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        grainShift: {
          "0%, 100%": { transform: "translate(0,0)" },
          "12%": { transform: "translate(-3%,-2%)" },
          "25%": { transform: "translate(-5%,3%)" },
          "37%": { transform: "translate(3%,-4%)" },
          "50%": { transform: "translate(-2%,5%)" },
          "62%": { transform: "translate(-4%,-3%)" },
          "75%": { transform: "translate(2%,3%)" },
          "87%": { transform: "translate(-3%,-2%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
