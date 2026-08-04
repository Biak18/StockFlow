import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { useUIStore } from "@/stores";
import { StyleSheet, View } from "react-native";

export default function RegisterScreen() {
  const theme = useUIStore((s) => s.theme);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <RegisterForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
