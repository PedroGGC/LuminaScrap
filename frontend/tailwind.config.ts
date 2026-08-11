import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        bg: "#07090e",
        surface: "#0e111a",
        "surface-card": "#131722",
        "surface-hover": "#1a2030",
        border: "#1e2436",
        "border-glow": "#2e3752",
        accent: "#6366f1",
        "accent-cyan": "#06b6d4",
        "accent-hover": "#4f46e5",
        price: "#10b981",
        warning: "#f59e0b",
        error: "#f43f5e",
      },
      boxShadow: {
        glow: "0 0 20px -3px rgba(99, 102, 241, 0.25)",
        "glow-cyan": "0 0 20px -3px rgba(6, 182, 212, 0.25)",
        "glow-emerald": "0 0 20px -3px rgba(16, 185, 129, 0.25)",
        "glow-red": "0 0 20px -3px rgba(244, 63, 94, 0.25)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "tech-grid": "linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
export default config;

