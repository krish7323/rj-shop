/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Amazon-inspired warm accent + deep navy chrome.
        accent: {
          50: "#fff8eb",
          100: "#feefc7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        navy: {
          700: "#1b2430",
          800: "#131a24",
          900: "#0d131b",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)",
        hover: "0 18px 40px -18px rgba(2,6,23,.35)",
        soft: "0 10px 30px -12px rgba(2,6,23,.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(.8)", opacity: "0" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up .35s ease-out both",
        pop: "pop .3s ease-out both",
      },
    },
  },
  plugins: [],
};
