import { useUIStore } from "@/stores";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function AuthLayout() {
  const theme = useUIStore((s) => s.theme);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="create-organization" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="register" />
      </Stack>
    </View>
  );
}
