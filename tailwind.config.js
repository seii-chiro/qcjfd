/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@shadcn/ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: ["Manrope", "serif"],
        secondary: ["Inter", "sans-serif"],
      },
      colors: {
        customGray: "#404958",
        grayWhtie: "rgba(172,172,172,0.25)",
        activeLinkColor: "rgba(255, 255, 255, 0.15)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        allSide: "0px 0px 2px 2px rgba(0, 0, 0, 0.1)",
      },
      keyframes: {
        bounceDot: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-0.25rem)" },
        },
      },
      animation: {
        bounceDot1: "bounceDot 1s infinite ease-in-out",
        bounceDot2: "bounceDot 1s infinite ease-in-out 0.2s",
        bounceDot3: "bounceDot 1s infinite ease-in-out 0.4s",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
