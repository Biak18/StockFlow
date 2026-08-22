import { useUIStore } from "@/stores";
import * as Haptics from "expo-haptics";
import { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const SPRING_CONFIG = { damping: 18, stiffness: 320, mass: 0.6 };

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: ButtonProps) {
  const theme = useUIStore((s) => s.theme);
  const scale = useSharedValue(1);
  const hapticCooldown = useRef(0);

  const isDisabled = disabled || loading;

  const backgroundColor = (() => {
    if (isDisabled) return theme.palette.neutral300;
    switch (variant) {
      case "primary":
        return theme.colors.primary;
      case "secondary":
        return theme.colors.surfaceSecondary ?? theme.colors.surface;
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
    if (variant === "ghost") return theme.colors.primary;
    if (variant === "secondary") return theme.colors.text;
    return theme.colors.textInverse;
  })();

  const paddingVertical = size === "sm" ? 9 : size === "lg" ? 16 : 13;
  const fontSize = size === "sm" ? 14 : size === "lg" ? 17 : 15;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      onPressIn?.(e);
      if (isDisabled) return;
      scale.value = withSpring(0.97, SPRING_CONFIG);
      const now = Date.now();
      if (now - hapticCooldown.current > 120) {
        hapticCooldown.current = now;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    },
    [onPressIn, isDisabled, scale],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      onPressOut?.(e);
      scale.value = withSpring(1, SPRING_CONFIG);
    },
    [onPressOut, scale],
  );

  return (
    <AnimatedTouchable
      activeOpacity={0.9}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        animatedStyle,
        {
          backgroundColor,
          paddingVertical,
          borderRadius: theme.radius.lg,
          borderWidth: variant === "secondary" || variant === "ghost" ? 1 : 0,
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
        <Text
          style={[styles.text as TextStyle, { color: textColor, fontSize }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </AnimatedTouchable>
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
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
