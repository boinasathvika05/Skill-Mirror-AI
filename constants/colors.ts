const ACCENT = "#00E5FF";
const ACCENT_VIOLET = "#7C3AED";
const ACCENT_GREEN = "#10B981";
const ACCENT_ORANGE = "#F59E0B";
const ACCENT_RED = "#EF4444";

export default {
  dark: {
    background: "#0A0F1E",
    surface: "#111827",
    card: "#1A2235",
    cardBorder: "#1E2D45",
    text: "#F0F4FF",
    textSecondary: "#8B9BC8",
    textMuted: "#4A5680",
    accent: ACCENT,
    accentViolet: ACCENT_VIOLET,
    accentGreen: ACCENT_GREEN,
    accentOrange: ACCENT_ORANGE,
    accentRed: ACCENT_RED,
    tabIconDefault: "#4A5680",
    tabIconSelected: ACCENT,
    tint: ACCENT,
    inputBg: "#141C2E",
    inputBorder: "#1E2D45",
    divider: "#1A2540",
    overlay: "rgba(0,0,0,0.7)",
  },
};

export type AppColors = typeof import("./colors").default.dark;
