export const colors = {
  primary: "#1B4D3E",
  secondary: "#4A6B6F",
  accent: "#B85A3E",
  accent2: "#CCA74E",
  background: "#EFF3F0",
  surface: "#DFE4E0",

  onPrimary: "#FFFFFF",
  onSecondary: "#FFFFFF",
  onAccent: "#FFFFFF",

  success: "#1B4D3E",
  warning: "#B85A3E",
  error: "#E74C3C",

  text: "#2C2C2C",
  // darkened from #8A9190 (was 2.8:1 on background — fails WCAG AA)
  textMuted: "#646B69",
  textFaint: "#646B69",
  divider: "rgba(138, 145, 144, 0.28)",
  errorSoft: "rgba(231, 76, 60, 0.08)",
  skeleton: "#CBD3CE",

  bucketNeeds: "#1B4D3E",
  bucketWants: "#C96B4F",
  bucketSavings: "#CCA74E",
} as const;

// Dark palette: same roles, tuned so fills stay visible against the near-black
// background and text clears 4.5:1 (PRD §8 — Light / Dark / System).
export const darkColors = {
  primary: "#2F7A63", // lighter teal so filled buttons read on dark bg
  secondary: "#5C8286",
  accent: "#D97A5C",
  accent2: "#D4B260",
  background: "#0E1311",
  surface: "#1A211E",

  onPrimary: "#FFFFFF",
  onSecondary: "#FFFFFF",
  onAccent: "#FFFFFF",

  success: "#2F7A63",
  warning: "#D97A5C",
  error: "#FF7A6B",

  text: "#ECF1EE",
  textMuted: "#9AA5A1",
  textFaint: "#84908B",
  divider: "rgba(154, 165, 161, 0.25)",
  errorSoft: "rgba(255, 122, 107, 0.12)",
  skeleton: "#232C28",

  bucketNeeds: "#2F7A63",
  bucketWants: "#D97A5C",
  bucketSavings: "#D4B260",
} as const;

// Widened to plain strings so both palettes (literal hex types) assign to it.
export type ColorSet = { [K in keyof typeof colors]: string };

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 36,
} as const;

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  bold: "700" as const,
};

export const font = {
  display: "Roboto",
  body: "Inter",
} as const;

export const palettes = {
  light: colors,
  dark: darkColors,
} as const;

export type PaletteMode = keyof typeof palettes;

export const theme = {
  colors,
  darkColors,
  palettes,
  space,
  radius,
  fontSize,
  fontWeight,
  font,
};