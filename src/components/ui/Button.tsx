import { useUIStore } from "@/stores";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useUIStore((s) => s.theme);

  const isDisabled = disabled || loading;

  const backgroundColor = (() => {
    if (isDisabled) return theme.palette.neutral300;
    switch (variant) {
      case "primary":
        return theme.colors.primary;
      case "secondary":
        return theme.colors.surfaceElevated;
      case "danger":
        return theme.colors.danger;
      case "ghost":
        return "transparent";
      default:
        return theme.colors.primary;
    }
  })();

  const textColor = (() => {
    if (isDisabled) return theme.palette.neutral500;
    if (variant === "secondary" || variant === "ghost")
      return theme.colors.text;
    return theme.colors.textInverse;
  })();

  const paddingVertical = size === "sm" ? 10 : size === "lg" ? 16 : 13;
  const fontSize = size === "sm" ? 14 : size === "lg" ? 17 : 16;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          backgroundColor,
          paddingVertical,
          borderRadius: theme.radius.lg,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: theme.colors.border,
          opacity: isDisabled ? 0.7 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        style as ViewStyle,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    minHeight: 48,
  },
  text: {
    fontWeight: "600",
  },
});
