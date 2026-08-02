/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "Inter", "SF Pro Rounded", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#FFC542",
          500: "#F5A623",
          600: "#E09314",
          700: "#B8720A",
        },
        gold: {
          400: "#FFC542",
          500: "#F5A623",
          600: "#E09314",
        },
        purpleGlow: {
          500: "#7B2FF7",
          600: "#C13CFF",
          700: "#FF3CAC",
        },
        ink: {
          900: "#0B0B0F",
          800: "#17171C",
          700: "#1E1E24",
        },
      },
      backgroundImage: {
        "gradient-signature": "linear-gradient(135deg, #F5A623 0%, #FFC542 100%)",
        "gradient-gold": "linear-gradient(135deg, #F5A623 0%, #FFC542 100%)",
        "gradient-purple-pink": "linear-gradient(135deg, #7B2FF7 0%, #C13CFF 50%, #FF3CAC 100%)",
      },
      boxShadow: {
        card: "0 8px 24px rgba(0, 0, 0, 0.4)",
        soft: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
        glow: "0 0 20px -3px rgba(245, 166, 35, 0.35)",
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
