export const palette = {
  // Primary
  primary50: "#EFF6FF",
  primary100: "#DBEAFE",
  primary200: "#BFDBFE",
  primary300: "#93C5FD",
  primary400: "#60A5FA",
  primary500: "#3B82F6",
  primary600: "#2563EB",
  primary700: "#1D4ED8",
  primary800: "#1E40AF",
  primary900: "#1E3A8A",

  // Neutral
  neutral0: "#FFFFFF",
  neutral50: "#F8FAFC",
  neutral100: "#F1F5F9",
  neutral200: "#E2E8F0",
  neutral300: "#CBD5E1",
  neutral400: "#94A3B8",
  neutral500: "#64748B",
  neutral600: "#475569",
  neutral700: "#334155",
  neutral800: "#1E293B",
  neutral900: "#0F172A",
  neutral950: "#020617",

  // Semantic
  success500: "#22C55E",
  success600: "#16A34A",
  warning500: "#F59E0B",
  warning600: "#D97706",
  danger500: "#EF4444",
  danger600: "#DC2626",
  info500: "#0EA5E9",
} as const;

export type ColorToken = keyof typeof palette;
