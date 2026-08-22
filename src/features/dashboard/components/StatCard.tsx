import { useUIStore } from "@/stores";
import * as Haptics from "expo-haptics";
import { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  tone?: "default" | "warning" | "danger" | "success";
  onPress?: () => void;
  icon?: React.ReactNode;
}

const SPRING_CONFIG = { damping: 20, stiffness: 340, mass: 0.5 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StatCard({
  label,
  value,
  subtitle,
  tone = "default",
  onPress,
  icon,
}: StatCardProps) {
  const theme = useUIStore((s) => s.theme);
  const scale = useSharedValue(1);
  const hapticCooldown = useRef(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.96, SPRING_CONFIG);
    const now = Date.now();
    if (now - hapticCooldown.current > 120) {
      hapticCooldown.current = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const accent =
    tone === "warning"
      ? theme.colors.warning
      : tone === "danger"
        ? theme.colors.danger
        : tone === "success"
          ? theme.colors.success
          : theme.colors.primary;

  const accentMuted =
    tone === "warning"
      ? (theme.colors.warningMuted ?? theme.colors.surfaceSecondary)
      : tone === "danger"
        ? (theme.colors.dangerMuted ?? theme.colors.surfaceSecondary)
        : theme.colors.primaryMuted ?? theme.colors.surfaceSecondary;

  const content = (
    <Animated.View
      style={[
        styles.card,
        animatedStyle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          ...theme.shadows.sm,
        },
      ]}
    >
      <View style={styles.top}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: accentMuted }]}>
            {icon}
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color: accent }]} numberOfLines={1}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.textTertiary }]}>
          {subtitle}
        </Text>
      ) : null}
    </Animated.View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return <View style={styles.pressable}>{content}</View>;
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: "45%",
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 92,
    height: 100,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
