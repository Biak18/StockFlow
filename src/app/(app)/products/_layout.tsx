import { useUIStore } from "@/stores/ui-store";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function ProductsLayout() {
  const theme = useUIStore((s) => s.theme);
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 280,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="create" />
        <Stack.Screen name="[id]" />
        <Stack.Screen name="edit/[id]" />
        <Stack.Screen name="stock/[id]" />
      </Stack>
    </View>
  );
}
