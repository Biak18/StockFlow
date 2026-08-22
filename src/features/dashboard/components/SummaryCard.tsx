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
      <View
        style={[styles.orb, styles.orbLg, { backgroundColor: "rgba(255,255,255,0.10)" }]}
      />
      <View
        style={[styles.orb, styles.orbSm, { backgroundColor: "rgba(255,255,255,0.14)" }]}
      />

      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {footnote ? (
        <View style={styles.footRow}>
          <View style={styles.footDivider} />
          <Text style={styles.foot}>{footnote}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 12,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbLg: {
    width: 180,
    height: 180,
    top: -90,
    right: -50,
  },
  orbSm: {
    width: 110,
    height: 110,
    bottom: -55,
    left: -30,
  },
  label: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  value: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 10,
    marginBottom: 10,
  },
  footRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footDivider: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  foot: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
});
