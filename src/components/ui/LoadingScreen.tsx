import { useUIStore } from "@/stores";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const AnimatedImage = Animated.createAnimatedComponent(Image);

export function LoadingScreen() {
  const theme = useUIStore((s) => s.theme);

  const lift = useSharedValue(0);
  const fadeIn = useSharedValue(0);
  const glow = useSharedValue(0.35);

  useEffect(() => {
    fadeIn.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });

    // Smooth float: goes up and back down without a jump
    lift.value = withRepeat(
      withTiming(-12, {
        duration: 1100,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true, // ← reverse (ping-pong)
    );

    glow.value = withRepeat(
      withTiming(0.75, {
        duration: 1100,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [fadeIn, glow, lift]);

  const crateStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + glow.value * 0.45,
    transform: [{ scale: 0.94 + glow.value * 0.08 }],
  }));

  const rootStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.center, rootStyle]}>
        <View style={styles.hero}>
          <Animated.View
            style={[
              styles.ring,
              ringStyle,
              {
                backgroundColor:
                  theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
              },
            ]}
          />
          <Animated.View style={[styles.crate, crateStyle]}>
            <AnimatedImage
              source={require("@/assets/images/icon.png")}
              style={styles.icon}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          StockFlow
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Loading your workspace…
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", paddingHorizontal: 24 },
  hero: {
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  ring: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 48,
  },
  crate: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 88,
    height: 88,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: { fontSize: 14 },
});
