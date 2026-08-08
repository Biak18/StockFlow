import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Button, SkeletonProductRow } from "@/components/ui";
import { BarcodeScannerModal } from "@/features/products/components/BarcodeScannerModal";
import { ProductCard } from "@/features/products/components/ProductCard";
import { findProductByBarcode } from "@/features/products/hooks/useProductByBarcode";
import { useProducts } from "@/features/products/hooks/useProducts";
import type { Product } from "@/features/products/types";
import { confirmDialog, useUIStore } from "@/stores";

type StockFilter = "all" | "low" | "out";

export default function ProductsScreen() {
  const theme = useUIStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const { products, loading, refreshing, error, onRefresh } = useProducts();

  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [scannerOpen, setScannerOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((p) => {
      if (q) {
        const haystack =
          `${p.name} ${p.sku ?? ""} ${p.barcode ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (stockFilter === "out" && p.quantity > 0) return false;
      if (
        stockFilter === "low" &&
        !(
          p.min_stock_level > 0 &&
          p.quantity > 0 &&
          p.quantity <= p.min_stock_level
        )
      ) {
        return false;
      }

      return true;
    });
  }, [products, query, stockFilter]);

  const handlePress = (product: Product) => {
    router.push(`/(app)/products/${product.id}`);
  };

  const handleCreate = () => {
    router.push("/(app)/products/create");
  };

  const handleScanned = async (barcode: string) => {
    setScannerOpen(false);
    const product = findProductByBarcode(barcode);

    if (product) {
      router.push(`/(app)/products/${product.id}`);
      return;
    }

    const ok = await confirmDialog({
      title: "Not found",
      message: `No product with barcode "${barcode}". Create it?`,
      confirmLabel: "Create",
      cancelLabel: "Cancel",
    });

    if (!ok) return;

    router.push({
      pathname: "/(app)/products/create",
      params: { barcode },
    });
  };

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Products
          </Text>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonProductRow key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* <FadeIn> */}
      <View style={[styles.header]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Products
        </Text>
        {/* <Pressable
            onPress={handleCreate}
            style={[
              styles.headerBtn,
              {
                backgroundColor:
                  theme.colors.surfaceSecondary ?? theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            hitSlop={8}
          >
            <Ionicons name="add" size={20} color={theme.colors.text} />
          </Pressable> */}
      </View>
      {/* </FadeIn> */}

      {/* Search + scan */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor:
                theme.colors.surfaceSecondary ?? theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={16}
            color={theme.colors.textTertiary}
          />
          <RNTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, SKU, barcode..."
            placeholderTextColor={theme.colors.textTertiary}
            style={[styles.searchInput, { color: theme.colors.text }]}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        <Pressable
          onPress={() => setScannerOpen(true)}
          style={[
            styles.scanBtn,
            {
              backgroundColor:
                theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
            },
          ]}
        >
          <Ionicons
            name="scan-outline"
            size={20}
            color={theme.colors.primary}
          />
        </Pressable>
      </View>

      {/* Chips */}
      <View style={styles.filters}>
        {(
          [
            { key: "all", label: "All" },
            { key: "low", label: "Low stock" },
            { key: "out", label: "Out of stock" },
          ] as const
        ).map((f) => {
          const active = stockFilter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setStockFilter(f.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? (theme.colors.primaryMuted ??
                      theme.colors.surfaceSecondary)
                    : (theme.colors.surfaceSecondary ?? theme.colors.surface),
                  borderColor: active
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Meta */}
      <View style={styles.listMeta}>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
          {filtered.length} product{filtered.length === 1 ? "" : "s"}
        </Text>
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.danger, marginBottom: 12 }}>
            {error}
          </Text>
          <Button title="Try again" onPress={onRefresh} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centered}>
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor:
                  theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
              },
            ]}
          >
            <Ionicons
              name="cube-outline"
              size={22}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Your catalog is empty
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Add your first product to start tracking stock and suppliers.
          </Text>
          <Button
            title="Add first product"
            onPress={handleCreate}
            style={{ marginTop: 18 }}
          />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No matches
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Try a different search or filter
          </Text>
        </View>
      ) : (
        <FlashList
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          data={filtered}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={handlePress} />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 75,
          }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* FAB */}
      {products.length > 0 ? (
        <Pressable
          onPress={handleCreate}
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
              bottom: insets.bottom + 24,
              ...theme.shadows.md,
            },
          ]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      ) : null}

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
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listMeta: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  fab: {
    position: "absolute",
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
