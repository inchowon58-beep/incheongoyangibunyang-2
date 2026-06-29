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
        cream: {
          DEFAULT: "#FAF8F4",
          dark: "#F0EBE3",
        },
        sand: "#E8DFD4",
        charcoal: "#1C1917",
        warm: {
          DEFAULT: "#78716C",
          light: "#A8A29E",
        },
        aga: {
          brown: "#8B6F47",
          gold: "#B8956B",
          dark: "#1A1614",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "Noto Serif KR",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
      },
      letterSpacing: {
        widest: "0.2em",
      },
    },
  },
  plugins: [],
};

export default config;
