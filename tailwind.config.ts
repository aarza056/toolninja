import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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
      },
      fontSize: {
        base: "14px",
      },
      borderRadius: {
        card: "8px",
        input: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
