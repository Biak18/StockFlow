import { useUIStore } from "@/stores/ui-store";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function SettingsLayout() {
  const theme = useUIStore((s) => s.theme);
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack screenOptions={{ headerShown: false, animation: "none" }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="team" />
      </Stack>
    </View>
  );
}
