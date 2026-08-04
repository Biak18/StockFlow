import { palette } from "./colors";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { spacing } from "./spacing";
import { typography } from "./typography";

export interface AppTheme {
  mode: "light" | "dark";
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    borderStrong: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    primary: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    overlay: string;
    surfaceSecondary: string;
    // Optional or required muted colors
    primaryMuted?: string;
    successMuted?: string;
    warningMuted?: string;
    dangerMuted?: string;
  };
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
  shadows: typeof shadows;
  palette: typeof palette;
}

export type ThemeColors = AppTheme["colors"];

export const lightTheme: AppTheme = {
  mode: "light" as const,
  colors: {
    background: palette.neutral50,
    surface: palette.neutral0,
    surfaceElevated: palette.neutral0,
    border: palette.neutral200,
    borderStrong: palette.neutral300,
    text: palette.neutral900,
    textSecondary: palette.neutral600,
    textTertiary: palette.neutral400,
    textInverse: palette.neutral0,
    primary: palette.primary600,
    success: palette.success600,
    warning: palette.warning600,
    danger: palette.danger600,
    info: palette.info500,
    overlay: "rgba(15, 23, 42, 0.5)",
    surfaceSecondary: palette.neutral100,
    primaryMuted: "#EEF3FF",
    successMuted: "#EAF7F0",
    warningMuted: "#FFF6E5",
    dangerMuted: "#FDEBEC",
  },
  spacing,
  typography,
  radius,
  shadows,
  palette,
};

export const darkTheme: AppTheme = {
  mode: "dark" as const,
  colors: {
    background: palette.neutral950,
    surface: palette.neutral900,
    surfaceElevated: palette.neutral800,
    border: palette.neutral700,
    borderStrong: palette.neutral600,
    text: palette.neutral50,
    textSecondary: palette.neutral400,
    textTertiary: palette.neutral500,
    textInverse: palette.neutral900,
    primary: palette.primary600,
    success: palette.success500,
    warning: palette.warning500,
    danger: palette.danger500,
    info: palette.info500,
    overlay: "rgba(0, 0, 0, 0.6)",
    surfaceSecondary: palette.neutral800,
  },
  spacing,
  typography,
  radius,
  shadows,
  palette,
};

// export type AppTheme = typeof lightTheme | typeof darkTheme;
// export type ThemeColors = AppTheme["colors"];

export * from "./colors";
export * from "./radius";
export * from "./shadows";
export * from "./spacing";
export * from "./typography";

