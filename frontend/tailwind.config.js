/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Neon/electric blue accent + sleek deep midnight chrome from logo.
        accent: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          400: "#38bdf8",
          500: "#0088ff",
          600: "#0284c7",
          700: "#0369a1",
        },
        navy: {
          700: "#0f172a",
          800: "#0b0f19",
          900: "#020617",
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
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pop: {
          "0%": { transform: "scale(.8)", opacity: "0" },
          "60%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "cart-bounce": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.28) rotate(-8deg)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-subtle": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.025)" },
        },
      },
      animation: {
        "fade-up": "fade-up .4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in .3s ease-out both",
        pop: "pop .35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        shimmer: "shimmer 1.5s infinite",
        "cart-bounce": "cart-bounce .45s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
        "slide-in-right": "slide-in-right .4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
