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
        background: "var(--background)",
        foreground: "var(--foreground)",
        eso: {
          dark: "#0b0e14",
          card: "#121722",
          cardHover: "#182030",
          border: "#232d3f",
          gold: "#d4af37",
          goldLight: "#f3e5ab",
          goldDark: "#997d24",
          accent: "#38bdf8",
          tank: "#3b82f6",
          healer: "#22c55e",
          dps: "#ef4444"
        }
      },
    },
  },
  plugins: [],
};
export default config;
