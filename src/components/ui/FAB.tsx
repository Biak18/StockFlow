import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "@/stores";
import { useFabKeyboardOffset } from "@/hooks/useFabKeyboardOffset";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "./PressableScale";

interface FabProps {
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  visible?: boolean;
}

export function FAB({ onPress, icon = "add", visible = true }: FabProps) {
  const theme = useUIStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const keyboardOffset = useFabKeyboardOffset();

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardOffset.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16).stiffness(220)}
      style={[
        styles.position,
        { bottom: insets.bottom + 24 },
        fabAnimatedStyle,
      ]}
    >
      <PressableScale
        onPress={onPress}
        scaleTo={0.88}
        haptic="medium"
        accessibilityLabel="Add new"
        accessibilityRole="button"
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            ...theme.shadows.md,
          },
        ]}
      >
        <Ionicons name={icon} size={26} color={theme.colors.textInverse} />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  position: {
    position: "absolute",
    right: 18,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
