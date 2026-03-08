/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          0: "#0a0a0c",
          1: "#111114",
          2: "#18181c",
          3: "#222228",
        },
        accent: {
          green: "#34d399",
          amber: "#fbbf24",
          rose: "#fb7185",
          blue: "#60a5fa",
          cyan: "#22d3ee",
        },
      },
    },
  },
  plugins: [],
};
