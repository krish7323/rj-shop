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
