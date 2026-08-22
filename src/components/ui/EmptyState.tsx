import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "@/stores";
import { StyleSheet, Text, View } from "react-native";

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const theme = useUIStore((s) => s.theme);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.iconBubble,
          {
            backgroundColor:
              theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
          },
        ]}
      >
        <Ionicons name={icon} size={26} color={theme.colors.primary} />
        <View
          style={[
            styles.orb,
            { backgroundColor: "rgba(59, 130, 246, 0.10)" },
          ]}
        />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  orb: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 999,
    top: -14,
    right: -22,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  action: {
    marginTop: 20,
    alignSelf: "stretch",
  },
});
