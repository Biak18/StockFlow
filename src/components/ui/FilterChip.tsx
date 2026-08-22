import { useUIStore } from "@/stores";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { PressableScale } from "./PressableScale";

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function FilterChip({ label, active, onPress, style }: FilterChipProps) {
  const theme = useUIStore((s) => s.theme);

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      haptic="light"
      style={[
        styles.chip,
        style,
        {
          backgroundColor: active
            ? theme.colors.primary
            : theme.colors.surface,
          borderColor: active ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: active ? theme.colors.textInverse : theme.colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  label: {
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
