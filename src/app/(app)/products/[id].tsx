import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
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
import { Button } from "@/components/ui";
import { inventoryRepository } from "@/features/inventory/services/inventory-repository";
import { useProduct } from "@/features/products/hooks/useProduct";
import { useProductImage } from "@/features/products/hooks/useProductImage";
import { productRepository } from "@/features/products/services/product-repository";
import {
  alertDialog,
  confirmDialog,
  useAuthStore,
  useCategoriesStore,
  useProductsStore,
  useSuppliersStore,
  useUIStore,
} from "@/stores";
import { formatMoney } from "@/utils/number-format";

export default function ProductDetailScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const removeProduct = useProductsStore((s) => s.removeProduct);
  const categories = useCategoriesStore((s) => s.categories);
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, loading, error } = useProduct(id);
  const imageUrl = useProductImage(product?.image_path);

  const [history, setHistory] = useState<
    {
      id: string;
      type: string;
      quantity_delta: number;
      created_at: string;
      notes: string | null;
    }[]
  >([]);

  useEffect(() => {
    if (!product || !organization?.id) return;

    inventoryRepository
      .listForProduct(organization.id, product.id)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [product?.id, organization?.id, product?.quantity]);

  const handleEdit = () => {
    if (!product) return;
    router.push(`/(app)/products/edit/${product.id}`);
  };

  const handleDelete = async () => {
    if (!product || !organization?.id) return;

    const ok = await confirmDialog({
      title: "Delete product?",
      message:
        "This removes the product from your active catalog. Stock history can remain in reports.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });

    if (!ok) return;

    try {
      await productRepository.softDelete(product.id, organization.id);
      removeProduct(product.id);
      router.back();
    } catch (err) {
      await alertDialog({
        title: "Error",
        message:
          err instanceof Error ? err.message : "Failed to delete product",
        confirmLabel: "OK",
      });
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <Text style={{ color: theme.colors.danger, marginBottom: 12 }}>
          {error || "Product not found"}
        </Text>
        <Button title="Go back" onPress={() => router.back()} />
      </View>
    );
  }

  const isOut = product.quantity <= 0;
  const isLow =
    product.min_stock_level > 0 &&
    product.quantity > 0 &&
    product.quantity <= product.min_stock_level;

  const categoryName =
    categories.find((c) => c.id === product.category_id)?.name ?? null;
  const supplierName =
    suppliers.find((s) => s.id === product.supplier_id)?.name ?? null;

  const inventoryValue = product.quantity * product.cost_price;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.topLabel, { color: theme.colors.textSecondary }]}>
          Product detail
        </Text>
        <Pressable onPress={handleDelete} style={styles.iconBtn} hitSlop={10}>
          <Ionicons
            name="trash-outline"
            size={20}
            color={theme.colors.danger}
          />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          {/* Hero */}
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          ) : (
            <View
              style={[
                styles.heroPlaceholder,
                {
                  backgroundColor:
                    theme.colors.surfaceSecondary ?? theme.colors.surface,
                },
              ]}
            >
              <Ionicons
                name="cube-outline"
                size={56}
                color={theme.colors.textTertiary}
              />
            </View>
          )}

          <Text style={[styles.name, { color: theme.colors.text }]}>
            {product.name}
          </Text>

          <View style={styles.metaRow}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
              {product.sku || "No SKU"}
            </Text>
            {categoryName ? (
              <>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: theme.colors.textTertiary },
                  ]}
                />
                <Text
                  style={{ color: theme.colors.textSecondary, fontSize: 12 }}
                >
                  {categoryName}
                </Text>
              </>
            ) : null}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isOut
                    ? (theme.colors.dangerMuted ??
                      theme.colors.surfaceSecondary)
                    : isLow
                      ? (theme.colors.warningMuted ??
                        theme.colors.surfaceSecondary)
                      : (theme.colors.successMuted ??
                        theme.colors.surfaceSecondary),
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: isOut
                    ? theme.colors.danger
                    : isLow
                      ? theme.colors.warning
                      : theme.colors.success,
                }}
              >
                {isOut ? "Out of stock" : isLow ? "Low stock" : "In stock"}
              </Text>
            </View>
          </View>
        </FadeIn>

        <Stagger baseDelay={80} step={40}>
          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleEdit}
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Ionicons name="pencil-outline" size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push(
                  `/(app)/products/stock/${product.id}?type=adjustment`,
                )
              }
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor:
                    theme.colors.surfaceSecondary ?? theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={theme.colors.text}
              />
              <Text
                style={[styles.secondaryBtnText, { color: theme.colors.text }]}
              >
                Adjust
              </Text>
            </Pressable>
          </View>

          <View style={styles.stockActions}>
            <Pressable
              onPress={() =>
                router.push(`/(app)/products/stock/${product.id}?type=in`)
              }
              style={[
                styles.stockChip,
                {
                  backgroundColor:
                    theme.colors.successMuted ?? theme.colors.surfaceSecondary,
                },
              ]}
            >
              <Ionicons
                name="arrow-down-outline"
                size={15}
                color={theme.colors.success}
              />
              <Text
                style={{
                  color: theme.colors.success,
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                Stock in
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push(`/(app)/products/stock/${product.id}?type=out`)
              }
              style={[
                styles.stockChip,
                {
                  backgroundColor:
                    theme.colors.dangerMuted ?? theme.colors.surfaceSecondary,
                },
              ]}
            >
              <Ionicons
                name="arrow-up-outline"
                size={15}
                color={theme.colors.danger}
              />
              <Text
                style={{
                  color: theme.colors.danger,
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                Stock out
              </Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View style={styles.statGrid}>
            <View
              style={[
                styles.stat,
                {
                  backgroundColor:
                    theme.colors.surfaceSecondary ?? theme.colors.surface,
                },
              ]}
            >
              <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>
                Current stock
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {product.quantity} {product.unit}
              </Text>
            </View>
            <View
              style={[
                styles.stat,
                {
                  backgroundColor:
                    theme.colors.surfaceSecondary ?? theme.colors.surface,
                },
              ]}
            >
              <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>
                Inventory value
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {inventoryValue.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Info rows */}
          <View style={[styles.infoList, { borderColor: theme.colors.border }]}>
            <InfoRow
              label="Supplier"
              value={supplierName ?? "—"}
              theme={theme}
            />
            <InfoRow
              label="Cost price"
              value={formatMoney(product.cost_price)}
              theme={theme}
            />
            <InfoRow
              label="Selling price"
              value={formatMoney(product.selling_price)}
              theme={theme}
            />
            <InfoRow
              label="Reorder point"
              value={`${formatMoney(product.min_stock_level)} ${product.unit}`}
              theme={theme}
            />
            <InfoRow
              label="Barcode"
              value={product.barcode || "—"}
              theme={theme}
              last
            />
          </View>

          {/* History */}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Stock movement
          </Text>

          {history.length === 0 ? (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
              No movements yet for this product.
            </Text>
          ) : (
            history.slice(0, 8).map((h) => {
              const isIn = h.quantity_delta > 0;
              const isOut = h.quantity_delta < 0;
              const color = isIn
                ? theme.colors.success
                : isOut
                  ? theme.colors.danger
                  : theme.colors.primary;
              const bg = isIn
                ? (theme.colors.successMuted ?? theme.colors.surfaceSecondary)
                : isOut
                  ? (theme.colors.dangerMuted ?? theme.colors.surfaceSecondary)
                  : (theme.colors.primaryMuted ??
                    theme.colors.surfaceSecondary);

              return (
                <View key={h.id} style={styles.historyRow}>
                  <View style={[styles.historyIcon, { backgroundColor: bg }]}>
                    <Ionicons
                      name={
                        isIn
                          ? "arrow-down-outline"
                          : isOut
                            ? "arrow-up-outline"
                            : "swap-horizontal-outline"
                      }
                      size={14}
                      color={color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.colors.text,
                        fontWeight: "700",
                        fontSize: 13,
                      }}
                    >
                      {h.type.toUpperCase()} · {isIn ? "+" : ""}
                      {h.quantity_delta} {product.unit}
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {h.notes || new Date(h.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <Text
                    style={{ color: theme.colors.textTertiary, fontSize: 11 }}
                  >
                    {new Date(h.created_at).toLocaleDateString()}
                  </Text>
                </View>
              );
            })
          )}
        </Stagger>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  theme,
  last,
}: {
  label: string;
  value: string;
  theme: any;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
        {label}
      </Text>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 13,
          fontWeight: "700",
          maxWidth: "60%",
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  topLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroImage: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    marginBottom: 16,
  },
  heroPlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryBtnText: {
    fontWeight: "800",
    fontSize: 13,
  },
  stockActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  stockChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
  },
  statValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  infoList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  historyIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
