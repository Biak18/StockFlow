import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  Button,
  EmptyState,
  FAB,
  FilterChip,
  ScreenHeader,
  SearchBar,
  SkeletonProductRow,
} from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
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
        <ScreenHeader title="Products" />
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
      <ScreenHeader
        title="Products"
        subtitle={
          products.length > 0
            ? `${products.length} in your catalog`
            : undefined
        }
      />

      {/* Search + scan */}
      <View style={styles.searchRow}>
        <View style={styles.searchFlex}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, SKU, barcode"
          />
        </View>

        <PressableScan onPress={() => setScannerOpen(true)} />
      </View>

      {/* Chips */}
      <View style={styles.filters}>
        {(
          [
            { key: "all", label: "All" },
            { key: "low", label: "Low stock" },
            { key: "out", label: "Out of stock" },
          ] as const
        ).map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            active={stockFilter === f.key}
            onPress={() => setStockFilter(f.key)}
          />
        ))}
      </View>

      {/* Meta */}
      <Text style={[styles.listMeta, { color: theme.colors.textSecondary }]}>
        {filtered.length} product{filtered.length === 1 ? "" : "s"}
      </Text>

      {error ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.danger, marginBottom: 12 }}>
            {error}
          </Text>
          <Button title="Try again" onPress={onRefresh} />
        </View>
      ) : products.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="Your catalog is empty"
          message="Add your first product to start tracking stock levels, suppliers and value."
          action={<Button title="Add first product" onPress={handleCreate} />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No matches"
          message="Try a different search or filter."
        />
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
            paddingBottom: insets.bottom + 110,
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

      <FAB onPress={handleCreate} visible={products.length > 0} />

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleScanned}
        title="Find product"
      />
    </SafeAreaView>
  );
}

function PressableScan({ onPress }: { onPress: () => void }) {
  const theme = useUIStore((s) => s.theme);
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.9}
      haptic="medium"
      accessibilityLabel="Scan barcode"
      accessibilityRole="button"
      style={[
        styles.scanBtn,
        {
          backgroundColor:
            theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
        },
      ]}
    >
      <Ionicons name="scan-outline" size={21} color={theme.colors.primary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchFlex: {
    flex: 1,
  },
  scanBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  listMeta: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
});
