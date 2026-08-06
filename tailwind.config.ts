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
        surface: {
          DEFAULT: "#fafaf8",
          raised: "#ffffff",
          inset: "#f5f3ee",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          muted: "#777777",
          faint: "#999999",
        },
        accent: {
          DEFAULT: "#b49a5a",
          hover: "#9a8348",
          soft: "#f5f3ee",
        },
        gold: {
          DEFAULT: "#b49a5a",
          light: "#d4cfc5",
        },
        module: {
          comanda: "#2563eb",
          cocina: "#ea580c",
          caja: "#16a34a",
          menu: "#9333ea",
          admin: "#475569",
        },
        mesa: {
          free: "#22c55e",
          order: "#eab308",
          bill: "#ef4444",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.06)",
        float: "0 8px 24px -4px rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
