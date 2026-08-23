import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Apple Music signature accent (red → pink).
        accent: {
          DEFAULT: "#fa2b42",
          hover: "#e21e37",
        },
      },
      boxShadow: {
        cover: "0 4px 16px rgba(0, 0, 0, 0.18)",
        "cover-hover": "0 8px 28px rgba(0, 0, 0, 0.28)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
