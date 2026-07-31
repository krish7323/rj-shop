/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          400: "#818cf8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338ca",
        },
        purple: {
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        ink: {
          900: "#0a0a0f",
          800: "#131318",
          700: "#1e1e24",
        },
      },
      backgroundImage: {
        "gradient-signature": "linear-gradient(135deg, #4F46E5, #7C3AED, #A855F7)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        soft: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
        glow: "0 0 20px -3px rgba(99, 102, 241, 0.35)",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up .35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in .25s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
