import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",

  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#111111",
        surface2: "#1a1a1a",
        border: "#222222",
        accent: "#a855f7",
        "accent-hover": "#9333ea",
        primary: "#f5f5f5",
        muted: "#888888",
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
        info: "#06b6d4",
      },
      fontSize: {
        base: "14px",
      },
      borderRadius: {
        card: "8px",
        input: "6px",
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.3s ease-out forwards",
        "fade-in": "fade-in 0.2s ease-out forwards",
      },
    },
  },

  plugins: [],
};

export default config;
