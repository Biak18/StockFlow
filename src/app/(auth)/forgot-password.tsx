import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { useUIStore } from "@/stores";
import { StyleSheet, View } from "react-native";

export default function ForgotPasswordScreen() {
  const theme = useUIStore((s) => s.theme);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ForgotPasswordForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
