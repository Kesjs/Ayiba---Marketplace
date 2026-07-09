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
  50: "#FAECE7",
  100: "#F5C4B3",
  200: "#F0997B",
  300: "#E97D54",
  400: "#D85A30",
  500: "#C24923",
  600: "#993C1D",
  700: "#82331A",
  800: "#712B13",
  900: "#4A1B0C",
},

        teal: {
          50: "#E1F5EE",
          100: "#9FE1CB",
          200: "#5DCAA5",
          400: "#1D9E75",
          600: "#0F6E56",
          800: "#085041",
          900: "#04342C",
        },
        amber: {
          50: "#FAEEDA",
          100: "#FAC775",
          400: "#EF9F27",
          600: "#BA7517",
          800: "#633806",
        },
        red: {
          50: "#FCEBEB",
          100: "#F7C1C1",
          400: "#E24B4A",
          600: "#A32D2D",
          800: "#791F1F",
        },
        gray: {
          50: "#F1EFE8",
          100: "#D3D1C7",
          200: "#B4B2A9",
          400: "#888780",
          600: "#5F5E5A",
          800: "#444441",
          900: "#2C2C2A",
        },
        white: "#FFFFFF",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        pill: "9999px",
      },
      fontWeight: {
        normal: "400",
        medium: "500",
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
