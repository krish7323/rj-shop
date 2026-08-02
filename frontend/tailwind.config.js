/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "Inter", "SF Pro Rounded", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Luxury Dark Theme palette
        dark: {
          base: "#0B0B0F",
          surface: "#17171C",
          elevated: "#1E1E24",
          border: "rgba(255, 255, 255, 0.08)",
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
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#FFC542",
          500: "#F5A623",
          600: "#E09314",
        },
        slateText: {
          main: "#FFFFFF",
          sub: "#9A9AA5",
          muted: "#6A6A78",
        },
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, #F5A623 0%, #FFC542 100%)",
        "gradient-gold-hover": "linear-gradient(135deg, #E09314 0%, #F5A623 100%)",
        "gradient-purple-pink": "linear-gradient(135deg, #7B2FF7 0%, #C13CFF 50%, #FF3CAC 100%)",
        "gradient-stage": "radial-gradient(circle at center, rgba(123, 47, 247, 0.35) 0%, rgba(193, 60, 255, 0.15) 50%, transparent 80%)",
        "gradient-card": "linear-gradient(180deg, rgba(30, 30, 36, 0.9) 0%, rgba(23, 23, 28, 0.95) 100%)",
      },
      boxShadow: {
        card: "0 8px 24px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 16px 36px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 166, 35, 0.15)",
        gold: "0 4px 20px rgba(245, 166, 35, 0.35)",
        glow: "0 0 25px rgba(193, 60, 255, 0.3)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "float-idle": {
          "0%, 100%": { transform: "translateY(0px) rotateX(0deg) rotateY(0deg)" },
          "50%": { transform: "translateY(-8px) rotateX(4deg) rotateY(-3deg)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pop-bounce": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.28) rotate(-4deg)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "float-idle": "float-idle 3.5s ease-in-out infinite",
        "fade-up": "fade-up .4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in .3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in .3s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "pop-bounce": "pop-bounce .35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        shimmer: "shimmer 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
