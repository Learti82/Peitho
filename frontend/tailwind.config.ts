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
        primary: {
          50: "#e8eef5",
          100: "#c5d4e6",
          200: "#9fb8d5",
          300: "#789bc4",
          400: "#5a85b7",
          500: "#3c70aa",
          600: "#2d5d95",
          700: "#264f80",
          800: "#1e3a5f",
          900: "#152840",
          DEFAULT: "#1e3a5f",
        },
        gold: {
          50: "#fdf8ed",
          100: "#f9edcc",
          200: "#f4e0a3",
          300: "#eecf72",
          400: "#e8bc47",
          500: "#c9a84c",
          600: "#b08f35",
          700: "#8f7228",
          800: "#6e581e",
          900: "#4e3e14",
          DEFAULT: "#c9a84c",
        },
        background: "#f8f9fa",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
