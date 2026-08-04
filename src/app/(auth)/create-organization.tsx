import { CreateOrganizationForm } from "@/features/auth/components/CreateOrganizationForm";
import { useUIStore } from "@/stores";
import { StyleSheet, View } from "react-native";

export default function CreateOrganizationScreen() {
  const theme = useUIStore((s) => s.theme);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <CreateOrganizationForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
