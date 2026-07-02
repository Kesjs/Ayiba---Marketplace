import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        coral: {
          50: "#FFF5F2",
          100: "#FFE8E1",
          200: "#FFD4C7",
          300: "#FFB3A0",
          400: "#FF8C75",
          500: "#FF6653",
          600: "#993C1D",
          700: "#7A2F17",
          800: "#5C2311",
          900: "#3D170B",
        },
        teal: {
          50: "#F0F9F8",
          100: "#D1EBE6",
          200: "#A3D9D0",
          300: "#6DC7B9",
          400: "#3FB5A2",
          500: "#1FA38B",
          600: "#0F766E",
          700: "#0D5F5A",
          800: "#0B4A48",
          900: "#093836",
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "ken-burns": "ken-burns 5s ease-in-out forwards",
      },
      keyframes: {
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "ken-burns": {
          "0%": {
            transform: "scale(1)",
          },
          "100%": {
            transform: "scale(1.1)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
