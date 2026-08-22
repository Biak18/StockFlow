import { Ionicons } from "@expo/vector-icons";
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
            theme.colors.dangerMuted ??
            (theme.mode === "dark" ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2"),
          borderColor:
            theme.mode === "dark"
              ? "rgba(239, 68, 68, 0.35)"
              : "rgba(220, 38, 38, 0.25)",
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: "rgba(239, 68, 68, 0.14)" },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={16}
          color={theme.colors.danger}
        />
      </View>
      <Text style={[styles.text, { color: theme.colors.danger }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },
});
