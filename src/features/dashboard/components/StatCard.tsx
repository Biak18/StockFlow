import { useUIStore } from "@/stores";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  tone?: "default" | "warning" | "danger" | "success";
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  subtitle,
  tone = "default",
  onPress,
  icon,
}: StatCardProps) {
  const theme = useUIStore((s) => s.theme);

  const valueColor =
    tone === "warning"
      ? theme.colors.warning
      : tone === "danger"
        ? theme.colors.danger
        : tone === "success"
          ? theme.colors.success
          : theme.colors.text;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          ...theme.shadows.sm,
        },
      ]}
    >
      <View style={styles.top}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
        {icon ? (
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor:
                  theme?.colors?.primaryMuted ??
                  theme?.colors?.surfaceSecondary,
              },
            ]}
          >
            {icon}
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.textTertiary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.pressable}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{content}</View>;
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: "45%",
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 92,
    height: 100,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
