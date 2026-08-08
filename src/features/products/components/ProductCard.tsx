import { useUIStore } from "@/stores";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useProductImage } from "../hooks/useProductImage";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const theme = useUIStore((s) => s.theme);
  const imageUrl = useProductImage(
    product.image_path ?? product.local_image_uri,
  );

  const isLowStock =
    product.min_stock_level > 0 && product.quantity <= product.min_stock_level;
  const isOutOfStock = product.quantity <= 0;

  return (
    <Pressable
      onPress={() => onPress(product)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.85 : 1,
          ...theme.shadows.sm,
        },
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
      ) : (
        <View
          style={[
            styles.thumbnailPlaceholder,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={{ color: theme.colors.textTertiary, fontSize: 11 }}>
            No img
          </Text>
        </View>
      )}

      <View style={styles.main}>
        <Text
          style={[styles.name, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <Text
          style={[styles.meta, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {product.sku ? `SKU: ${product.sku}` : "No SKU"}
          {product.barcode ? `  ·  ${product.barcode}` : ""}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.qty, { color: theme.colors.text }]}>
          {product.quantity} {product.unit}
        </Text>
        {isOutOfStock ? (
          <Text style={[styles.badge, { color: theme.colors.danger }]}>
            Out of stock
          </Text>
        ) : isLowStock ? (
          <Text style={[styles.badge, { color: theme.colors.warning }]}>
            Low stock
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
  },
  right: {
    alignItems: "flex-end",
  },
  qty: {
    fontSize: 15,
    fontWeight: "600",
  },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
});
