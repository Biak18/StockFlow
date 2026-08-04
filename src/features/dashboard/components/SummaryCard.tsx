import { useUIStore } from "@/stores";
import { StyleSheet, Text, View } from "react-native";

interface SummaryCardProps {
  label: string;
  value: string;
  footnote?: string;
}

export function SummaryCard({ label, value, footnote }: SummaryCardProps) {
  const theme = useUIStore((s) => s.theme);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radius.xl,
          ...theme.shadows.md,
        },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {footnote ? <Text style={styles.foot}>{footnote}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginBottom: 12,
    overflow: "hidden",
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
  },
  value: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 8,
    marginBottom: 8,
  },
  foot: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
  },
});
