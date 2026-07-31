/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Stripe & Linear inspired Indigo / Purple palette
        indigo: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338ca",
        },
        purple: {
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        accent: {
          50: "#eef2ff",
          100: "#e0e7ff",
          400: "#818cf8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338ca",
        },
        navy: {
          700: "#0f172a",
          800: "#0a0a0f",
          900: "#07070a",
        },
      },
      backgroundImage: {
        "gradient-signature": "linear-gradient(135deg, #4F46E5, #7C3AED, #A855F7)",
        "gradient-signature-hover": "linear-gradient(135deg, #4338ca, #6D28D9, #9333EA)",
        "gradient-subtle": "linear-gradient(180deg, rgba(99, 102, 241, 0.04) 0%, rgba(139, 92, 246, 0.02) 100%)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        hover: "0 12px 28px -8px rgba(79, 70, 229, 0.15), 0 4px 12px -2px rgba(124, 58, 237, 0.08)",
        glow: "0 0 20px -3px rgba(99, 102, 241, 0.4)",
        soft: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "cart-bounce": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15) rotate(-4deg)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-subtle": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.015)" },
        },
      },
      animation: {
        "fade-up": "fade-up .4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in .3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in .3s cubic-bezier(0.16, 1, 0.3, 1) both",
        pop: "pop .25s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "cart-bounce": "cart-bounce .35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right": "slide-in-right .35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
