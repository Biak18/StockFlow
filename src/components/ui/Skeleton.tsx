import { useUIStore } from "@/stores";
import { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius,
  style,
}: SkeletonProps) {
  const theme = useUIStore((s) => s.theme);
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
  }, [t]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(t.value, [0, 0.5, 1], [0.45, 0.9, 0.45]);
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? theme.radius.md,
          backgroundColor: theme.colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
