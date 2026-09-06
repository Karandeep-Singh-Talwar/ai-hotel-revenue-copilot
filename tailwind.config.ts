import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2EC4B6",
        "primary-neon": "#18d8c5",
        "background-base": "#0B132B",
        "background-dark": "#0B132B",
        surface: "#1C2541",
        muted: "#6F7D9E",
        accent: "#E71D36",
        intelligence: "#FF9F1C",
        highlight: "#2A375C",
        border: "#3A506B",
        "matrix-bg": "#0B132B",
        "matrix-surface": "#1C2541",
        "matrix-muted": "#6F7D9E",
        "matrix-accent": "#E71D36",
        "matrix-hover": "#2A375C",
        "sidebar-bg": "#111817",
      },
      fontFamily: {
        heading: ["Clash Display", "Satoshi", "sans-serif"],
        body: ["Satoshi", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "0.25rem",
        md: "0.5rem",
        lg: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
export default config;
