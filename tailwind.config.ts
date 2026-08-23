import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wax: {
          bg: "#0f0e0c",
          card: "#1a1815",
          border: "#2c2925",
          gold: "#d4a24e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
