import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { FadeIn, Stagger } from "@/components/motion";
import { SkeletonDashboard } from "@/components/ui";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { SummaryCard } from "@/features/dashboard/components/SummaryCard";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { BarcodeScannerModal } from "@/features/products/components/BarcodeScannerModal";
import { findProductByBarcode } from "@/features/products/hooks/useProductByBarcode";
import { syncEngine } from "@/services/sync/sync-engine";
import { confirmDialog, useAuthStore, useUIStore } from "@/stores";
import { formatMoney } from "@/utils/number-format";

function formatMovementType(type: string) {
  switch (type) {
    case "in":
      return "Stock In";
    case "out":
      return "Stock Out";
    case "adjustment":
      return "Adjustment";
    default:
      return type;
  }
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "SF";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardScreen() {
  const theme = useUIStore((s) => s.theme);
  const isOnline = useUIStore((s) => s.isOnline);
  const isSyncing = useUIStore((s) => s.isSyncing);

  const profile = useAuthStore((s) => s.profile);
  const organization = useAuthStore((s) => s.currentOrganization);
  const insets = useSafeAreaInsets();

  const { stats, movements, loading, movementsError, refreshing, onRefresh } =
    useDashboard();

  const [pendingCount, setPendingCount] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      try {
        const count = await syncEngine.pendingCount();
        if (mounted) setPendingCount(count);
      } catch {
        // ignore
      }
    };

    tick();
    const id = setInterval(tick, 4000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isOnline, isSyncing]);

  const handleScanned = async (barcode: string) => {
    setScannerOpen(false);

    const product = findProductByBarcode(barcode);

    if (product) {
      router.push(`/(app)/products/${product.id}`);
      return;
    }

    const create = await confirmDialog({
      title: "Not found",
      message: `No product with barcode "${barcode}". Create it?`,
      confirmLabel: "Create",
      cancelLabel: "Cancel",
    });

    if (create) {
      router.push({
        pathname: "/(app)/products/create",
        params: { barcode },
      });
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <SkeletonDashboard />
      </View>
    );
  }

  const firstName = profile?.full_name?.split(/\s+/)[0];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{
          // paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <FadeIn>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text
                style={[styles.eyebrow, { color: theme.colors.textSecondary }]}
              >
                {organization?.name ?? "StockFlow"}
              </Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Hello{firstName ? `, ${firstName}` : ""}
              </Text>
              <Text
                style={[styles.subtitle, { color: theme.colors.textSecondary }]}
              >
                Here’s the pulse of your inventory
              </Text>
            </View>

            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
                },
              ]}
            >
              <Text
                style={[styles.avatarText, { color: theme.colors.primary }]}
              >
                {getInitials(profile?.full_name)}
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* Offline / sync banner */}
        {!isOnline ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor:
                  theme.colors.warningMuted ?? theme.colors.surfaceSecondary,
              },
            ]}
          >
            <Ionicons
              name="cloud-offline-outline"
              size={16}
              color={theme.colors.warning}
            />
            <Text style={[styles.bannerText, { color: theme.colors.warning }]}>
              Offline — showing last synced data. Changes will sync when you
              reconnect.
            </Text>
          </View>
        ) : pendingCount > 0 || isSyncing ? (
          <View
            style={[
              styles.banner,
              {
                backgroundColor:
                  theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
              },
            ]}
          >
            <Ionicons
              name={isSyncing ? "sync-outline" : "cloud-upload-outline"}
              size={16}
              color={theme.colors.primary}
            />
            <Text style={[styles.bannerText, { color: theme.colors.primary }]}>
              {isSyncing
                ? "Syncing changes…"
                : `${pendingCount} change${pendingCount === 1 ? "" : "s"} pending sync`}
            </Text>
          </View>
        ) : null}

        <Stagger baseDelay={50} step={45}>
          {/* Summary */}
          <SummaryCard
            label="Total inventory value"
            value={formatMoney(stats.inventoryValueCost)}
            footnote={`Across ${stats.totalProducts} products · sell ${formatMoney(
              stats.inventoryValueSelling,
            )}`}
          />

          {/* Metrics */}
          <View style={styles.grid}>
            <StatCard
              label="Products"
              value={String(stats.totalProducts)}
              subtitle={`${stats.totalUnits.toLocaleString()} units`}
              icon={
                <Ionicons
                  name="cube-outline"
                  size={14}
                  color={theme.colors.primary}
                />
              }
              onPress={() => router.push("/(app)/products")}
            />

            <StatCard
              label="Low stock"
              value={String(stats.lowStockCount)}
              tone={stats.lowStockCount > 0 ? "warning" : "default"}
              icon={
                <Ionicons
                  name="warning-outline"
                  size={14}
                  color={theme.colors.warning}
                />
              }
              onPress={() => router.push("/(app)/products")}
            />
            <StatCard
              label="Out of stock"
              value={String(stats.outOfStockCount)}
              tone={stats.outOfStockCount > 0 ? "danger" : "default"}
              icon={
                <Ionicons
                  name="close-circle-outline"
                  size={14}
                  color={theme.colors.danger}
                />
              }
              onPress={() => router.push("/(app)/products")}
            />
            <StatCard
              label="Units on hand"
              value={stats.totalUnits.toLocaleString()}
              icon={
                <Ionicons
                  name="layers-outline"
                  size={14}
                  color={theme.colors.primary}
                />
              }
            />
          </View>

          {/* Quick actions */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Quick actions
          </Text>
          <View style={styles.quickRow}>
            {(
              [
                {
                  label: "Add",
                  icon: "add-outline" as const,
                  onPress: () => router.push("/(app)/products/create"),
                },
                {
                  label: "Scan",
                  icon: "scan-outline" as const,
                  onPress: () => setScannerOpen(true),
                },
                {
                  label: "Products",
                  icon: "cube-outline" as const,
                  onPress: () => router.push("/(app)/products"),
                },
                {
                  label: "Reports",
                  icon: "bar-chart-outline" as const,
                  onPress: () => {
                    router.push("/(app)/settings/reports");
                  },
                },
              ] as const
            ).map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.quick,
                  {
                    backgroundColor: theme?.colors?.surface,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.quickIcon,
                    {
                      backgroundColor:
                        theme?.colors?.primaryMuted ??
                        theme?.colors?.surfaceSecondary,
                    },
                  ]}
                >
                  <Ionicons
                    name={action.icon}
                    size={16}
                    color={theme.colors.primary}
                  />
                </View>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Recent activity */}
          <View style={styles.sectionHead}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, marginBottom: 0 },
              ]}
            >
              Recent activity
            </Text>
          </View>

          {movementsError ? (
            <Text style={{ color: theme.colors.danger, marginBottom: 12 }}>
              {movementsError}
            </Text>
          ) : null}

          {movements.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor:
                    theme?.colors?.surfaceSecondary ?? theme?.colors?.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.emptyIcon,
                  {
                    backgroundColor:
                      theme.colors.primaryMuted ?? theme.colors.surface,
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No movement yet
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Stock activity will appear here after your first inventory
                operation.
              </Text>
            </View>
          ) : (
            movements.map((m) => {
              const isIn = m.quantity_delta > 0;
              const isOut = m.quantity_delta < 0;
              const dotBg = isIn
                ? (theme.colors.successMuted ?? theme.colors.surfaceSecondary)
                : isOut
                  ? (theme.colors.dangerMuted ?? theme.colors.surfaceSecondary)
                  : (theme.colors.primaryMuted ??
                    theme.colors.surfaceSecondary);
              const dotColor = isIn
                ? theme.colors.success
                : isOut
                  ? theme.colors.danger
                  : theme.colors.primary;

              return (
                <Pressable
                  key={m.id}
                  onPress={() => router.push(`/(app)/products/${m.product_id}`)}
                  style={({ pressed }) => [
                    styles.movementRow,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: dotBg }]}>
                    <Ionicons
                      name={
                        isIn
                          ? "arrow-down-outline"
                          : isOut
                            ? "arrow-up-outline"
                            : "swap-horizontal-outline"
                      }
                      size={14}
                      color={dotColor}
                    />
                  </View>

                  <View style={styles.movementBody}>
                    <Text
                      style={[
                        styles.movementTitle,
                        { color: theme.colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {m.product_name ?? "Product"}
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: 12,
                      }}
                      numberOfLines={1}
                    >
                      {formatMovementType(m.type)}
                      {m.notes ? ` · ${m.notes}` : ""}
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.textTertiary,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {new Date(m.created_at).toLocaleString()}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      color: dotColor,
                    }}
                  >
                    {isIn ? "+" : ""}
                    {m.quantity_delta}
                  </Text>
                </Pressable>
              );
            })
          )}
        </Stagger>
      </ScrollView>

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleScanned}
        title="Find product"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },
  quick: {
    flex: 1,
    alignItems: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: "dashed",
    padding: 20,
    alignItems: "center",
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  movementRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  movementBody: {
    flex: 1,
    minWidth: 0,
  },
  movementTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
});
