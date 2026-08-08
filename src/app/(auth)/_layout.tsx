import { useAuthStore, useUIStore } from "@/stores";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function AuthLayout() {
  const theme = useUIStore((s) => s.theme);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const organization = useAuthStore((s) => s.currentOrganization);
  const needsOrg = isAuthenticated && !organization;
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack
        initialRouteName={needsOrg ? "create-organization" : "login"}
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
