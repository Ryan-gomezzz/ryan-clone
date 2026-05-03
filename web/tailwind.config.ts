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
        "bg-soft": "var(--bg-soft)",
        fg: "var(--fg)",
        "fg-muted": "var(--fg-muted)",
        "fg-subtle": "var(--fg-subtle)",
        accent: "var(--accent)",
        "accent-hot": "var(--accent-hot)",
        "accent-deep": "var(--accent-deep)",
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        danger: "var(--danger)",
        success: "var(--success)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        script: ["var(--font-script)", "cursive"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      animation: {
        "subtle-pulse": "subtlePulse 3s ease-in-out infinite",
        "slow-spin": "spin 24s linear infinite",
      },
      keyframes: {
        subtlePulse: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
