// src/lib/theme.js
// Central design tokens - DARK premium mobile-first theme
// Completely different from the website's light design

export const colors = {
  // Dark base palette (opposite of website's white)
  bg: "#080d16",
  card: "#0f1724",
  cardBorder: "#1e293b",
  navy: "#020617",
  navy800: "#0b0f19",
  navy700: "#0f172a",

  // Electric accent - Purple (website uses blue #0088ff)
  accent: "#7c3aed",
  accentLight: "#a855f7",
  accentDark: "#5b21b6",
  accentGlow: "#7c3aed44",

  // Secondary - Cyan electric
  cyan: "#06b6d4",
  cyanGlow: "#06b6d433",

  // Text on dark bg
  text: "#f1f5f9",
  sub: "#94a3b8",
  muted: "#475569",

  // Status
  success: "#10b981",
  successGlow: "#10b98133",
  danger: "#f43f5e",
  dangerGlow: "#f43f5e33",
  warning: "#f59e0b",

  // Borders
  border: "#1e293b",
  borderLight: "#334155",

  // Star rating
  star: "#f59e0b",

  // Gradient stops
  gradStart: "#7c3aed",
  gradEnd: "#06b6d4",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, pill: 999 };

