import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: { DEFAULT: "#0E1116", 2: "#2A2F37", 3: "#5B616B", 4: "#8A9099" },
        paper: { DEFAULT: "#FAFAF8", 2: "#F3F3F0", 3: "#ECEBE7" },
        line: { DEFAULT: "#E4E3DE", 2: "#D6D4CE" },
        bp: { DEFAULT: "#3452F5", 2: "#2440DB", soft: "#EDF0FF", line: "#C9D2FF" },
        ok: { DEFAULT: "#138A4B", soft: "#E6F5EC" },
        warn: { DEFAULT: "#B45309", soft: "#FEF3E2" },
        bad: { DEFAULT: "#D93A40", soft: "#FDECEC" },
        ide: { bg: "#0D0F14", panel: "#12151C", line: "#1F232D", hi: "#1A1E27", text: "#C9CED8", dim: "#6B7280" },
      },
      boxShadow: {
        card: "0 1px 0 rgba(14,17,22,0.04), 0 1px 3px rgba(14,17,22,0.06)",
        pop: "0 12px 40px -8px rgba(14,17,22,0.18), 0 2px 6px rgba(14,17,22,0.06)",
      },
      keyframes: {
        in: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
        pulseDot: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".35" } },
      },
      animation: { in: "in .25s ease-out both", pulseDot: "pulseDot 1.2s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
