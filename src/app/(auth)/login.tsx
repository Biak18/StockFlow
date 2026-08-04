import { LoginForm } from "@/features/auth/components/LoginForm";
import { useUIStore } from "@/stores";
import { StyleSheet, View } from "react-native";

export default function LoginScreen() {
  const theme = useUIStore((s) => s.theme);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <LoginForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
