import { useUIStore } from "@/stores";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "./Skeleton";

export function SkeletonProductRow() {
  const theme = useUIStore((s) => s.theme);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <Skeleton width={48} height={48} borderRadius={12} />
      <View style={styles.mid}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="45%" style={{ marginTop: 8 }} />
      </View>
      <View style={styles.right}>
        <Skeleton height={14} width={40} />
        <Skeleton height={12} width={52} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={{ gap: 12, paddingHorizontal: 16 }}>
      <Skeleton height={110} borderRadius={20} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Skeleton height={88} style={{ flex: 1 }} borderRadius={16} />
        <Skeleton height={88} style={{ flex: 1 }} borderRadius={16} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Skeleton height={88} style={{ flex: 1 }} borderRadius={16} />
        <Skeleton height={88} style={{ flex: 1 }} borderRadius={16} />
      </View>
      <Skeleton height={70} borderRadius={14} />
      <Skeleton height={70} borderRadius={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  mid: { flex: 1 },
  right: { alignItems: "flex-end" },
});
