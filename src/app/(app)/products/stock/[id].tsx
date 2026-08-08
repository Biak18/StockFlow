import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeIn } from "@/components/motion/FadeIn";
import { Button } from "@/components/ui";
import { StockMovementForm } from "@/features/inventory/components/StockMovementForm";
import type { StockMovementFormValues } from "@/features/inventory/schemas/inventory-schemas";
import { inventoryRepository } from "@/features/inventory/services/inventory-repository";
import type { InventoryTxnType } from "@/features/inventory/types";
import { useProduct } from "@/features/products/hooks/useProduct";
import {
  clearLowStockNotifHash,
  notifyLowStockIfNeeded,
} from "@/services/notifications/low-stock";
import { useAuthStore, useProductsStore, useUIStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";

export default function StockMovementScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const profile = useAuthStore((s) => s.profile);
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const insets = useSafeAreaInsets();

  const { id, type } = useLocalSearchParams<{
    id: string;
    type: InventoryTxnType;
  }>();
  const movementType = (type as InventoryTxnType) || "in";

  const { product, loading, error } = useProduct(id);

  const titleMap: Record<InventoryTxnType, string> = {
    in: "Stock In",
    out: "Stock Out",
    adjustment: "Adjust Stock",
  };

  const handleSubmit = async (values: StockMovementFormValues) => {
    if (!organization?.id || !product) {
      throw new Error("Missing product or organization");
    }

    const updated = await inventoryRepository.applyMovement({
      organizationId: organization.id,
      productId: product.id,
      type: movementType,
      quantity: values.quantity,
      notes: values.notes?.trim() || null,
      performedBy: profile?.id ?? null,
      currentQuantity: product.quantity,
    });

    // Keep Zustand list in sync
    updateProduct(product.id, {
      quantity: updated.quantity,
      updated_at: updated.updated_at,
    });
    useUIStore.getState().bumpInventoryRevision();
    await clearLowStockNotifHash(); // allow a new notification
    await notifyLowStockIfNeeded(useProductsStore.getState().products);
    router.back();
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

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FadeIn>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {titleMap[movementType]}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <Text
          style={[styles.productName, { color: theme.colors.textSecondary }]}
        >
          {product.name}
        </Text>
      </FadeIn>

      <StockMovementForm
        type={movementType}
        currentQuantity={product.quantity}
        unit={product.unit}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 17, fontWeight: "600" },
  productName: {
    fontSize: 15,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
});
