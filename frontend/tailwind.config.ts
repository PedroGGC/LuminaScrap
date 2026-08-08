import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#09090b",
        surface: "#18181b",
        border: "#27272a",
        accent: "#6366f1",
        "accent-hover": "#4f46e5",
        price: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
      },
    },
  },
  plugins: [],
};
export default config;
