import { useUIStore } from "@/stores";
import { StyleSheet, Text, View } from "react-native";

interface ErrorMessageProps {
  message?: string | null;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  const theme = useUIStore((s) => s.theme);

  if (!message) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme.mode === "dark" ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
          borderColor: theme.colors.danger,
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.danger }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: "500",
  },
});
