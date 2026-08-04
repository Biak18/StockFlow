import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui";
import { buildValuation, productsToCsv } from "@/features/reports";
import { alertDialog, useProductsStore, useUIStore } from "@/stores";
import { shareTextFile } from "@/utils/share-file";
import { Ionicons } from "@expo/vector-icons";

export default function ReportsScreen() {
  const theme = useUIStore((s) => s.theme);
  const products = useProductsStore((s) => s.products);
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState(false);

  const { rows, totals } = useMemo(() => buildValuation(products), [products]);

  const lowStock = useMemo(
    () =>
      products.filter(
        (p) =>
          p.min_stock_level > 0 &&
          p.quantity > 0 &&
          p.quantity <= p.min_stock_level,
      ),
    [products],
  );

  const outOfStock = useMemo(
    () => products.filter((p) => p.quantity <= 0),
    [products],
  );

  const handleExportProducts = async () => {
    try {
      setExporting(true);
      const csv = productsToCsv(products);
      const stamp = new Date().toISOString().slice(0, 10);
      await shareTextFile({
        content: csv,
        fileName: `stockflow-products-${stamp}.csv`,
      });
    } catch (err) {
      await alertDialog({
        title: "Export failed",
        message: err instanceof Error ? err.message : "Could not export CSV",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
        }}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.navigate("/(app)/settings")}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Reports
          </Text>
          <View style={{ width: 35 }} />
        </View>

        {/* Valuation summary */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Stock valuation
          </Text>
          <Text style={[styles.metric, { color: theme.colors.text }]}>
            Cost value: {totals.cost.toLocaleString()}
          </Text>
          <Text style={[styles.metric, { color: theme.colors.text }]}>
            Selling value: {totals.selling.toLocaleString()}
          </Text>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
            {products.length} products · {totals.units.toLocaleString()} units
          </Text>
        </View>

        <Button
          title="Export products CSV"
          onPress={handleExportProducts}
          loading={exporting}
          fullWidth
          style={{ marginBottom: 20 }}
        />

        {/* Low stock */}
        <Text style={[styles.section, { color: theme.colors.text }]}>
          Low stock ({lowStock.length})
        </Text>
        {lowStock.length === 0 ? (
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 16 }}>
            None
          </Text>
        ) : (
          lowStock.slice(0, 15).map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/(app)/products/${p.id}`)}
              style={[
                styles.line,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text
                style={{ color: theme.colors.text, fontWeight: "600", flex: 1 }}
              >
                {p.name}
              </Text>
              <Text style={{ color: theme.colors.warning, fontWeight: "600" }}>
                {p.quantity} {p.unit}
              </Text>
            </Pressable>
          ))
        )}

        {/* Out of stock */}
        <Text
          style={[styles.section, { color: theme.colors.text, marginTop: 12 }]}
        >
          Out of stock ({outOfStock.length})
        </Text>
        {outOfStock.length === 0 ? (
          <Text style={{ color: theme.colors.textSecondary }}>None</Text>
        ) : (
          outOfStock.slice(0, 15).map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push(`/(app)/products/${p.id}`)}
              style={[
                styles.line,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text
                style={{ color: theme.colors.text, fontWeight: "600", flex: 1 }}
              >
                {p.name}
              </Text>
              <Text style={{ color: theme.colors.danger, fontWeight: "600" }}>
                0 {p.unit}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: "600" },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  metric: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  section: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
});
