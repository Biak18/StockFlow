// src/components/ui/LoadingScreen.tsx
import { useUIStore } from "@/stores";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export function LoadingScreen() {
  const theme = useUIStore((s) => s.theme);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
