import * as Haptics from "expo-haptics";
import { useCallback, useRef } from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type HapticLevel = "none" | "light" | "medium" | "heavy";

interface PressableScaleProps extends PressableProps {
  scaleTo?: number;
  haptic?: HapticLevel;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const SPRING_CONFIG = { damping: 20, stiffness: 340, mass: 0.5 };

const HAPTIC_MAP: Record<
  Exclude<HapticLevel, "none">,
  (h: typeof Haptics.ImpactFeedbackStyle) => Promise<void>
> = {
  light: (h) => Haptics.impactAsync(h.Light),
  medium: (h) => Haptics.impactAsync(h.Medium),
  heavy: (h) => Haptics.impactAsync(h.Heavy),
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  scaleTo = 0.97,
  haptic = "light",
  onPressIn,
  onPressOut,
  style,
  children,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const lastHapticAt = useRef(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      onPressIn?.(e);
      if (disabled) return;
      scale.value = withSpring(scaleTo, SPRING_CONFIG);
      if (haptic !== "none") {
        const now = Date.now();
        if (now - lastHapticAt.current > 120) {
          lastHapticAt.current = now;
          HAPTIC_MAP[haptic](Haptics.ImpactFeedbackStyle).catch(() => {});
        }
      }
    },
    [onPressIn, disabled, scaleTo, haptic, scale],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      onPressOut?.(e);
      scale.value = withSpring(1, SPRING_CONFIG);
    },
    [onPressOut, scale],
  );

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.base, animatedStyle, style]}
      disabled={disabled}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {},
});
