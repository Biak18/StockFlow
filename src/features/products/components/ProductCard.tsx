import { useUIStore } from "@/stores";
import * as Haptics from "expo-haptics";
import { useCallback, useRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { formatMoney } from "@/utils/number-format";
import { Ionicons } from "@expo/vector-icons";
import { useProductImage } from "../hooks/useProductImage";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

const SPRING_CONFIG = { damping: 20, stiffness: 340, mass: 0.5 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProductCard({ product, onPress }: ProductCardProps) {
  const theme = useUIStore((s) => s.theme);
  const scale = useSharedValue(1);
  const hapticCooldown = useRef(0);
  const imageUrl = useProductImage(
    product.image_path ?? product.local_image_uri,
  );

  const isLowStock =
    product.min_stock_level > 0 && product.quantity <= product.min_stock_level;
  const isOutOfStock = product.quantity <= 0;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, SPRING_CONFIG);
    const now = Date.now();
    if (now - hapticCooldown.current > 120) {
      hapticCooldown.current = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const badgeBg = isOutOfStock
    ? (theme.colors.dangerMuted ?? theme.colors.surfaceSecondary)
    : (theme.colors.warningMuted ?? theme.colors.surfaceSecondary);
  const badgeColor = isOutOfStock ? theme.colors.danger : theme.colors.warning;

  return (
    <AnimatedPressable
      onPress={() => onPress(product)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        animatedStyle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
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
              backgroundColor:
                theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
            },
          ]}
        >
          <Ionicons
            name="cube-outline"
            size={20}
            color={theme.colors.primary}
          />
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
          {product.sku ? product.sku : "No SKU"}
        </Text>
        <Text style={[styles.price, { color: theme.colors.textSecondary }]}>
          {formatMoney(product.selling_price)}
          <Text style={{ color: theme.colors.textTertiary }}>
            {" "}
            · {product.quantity} {product.unit} on hand
          </Text>
        </Text>
      </View>

      <View style={styles.right}>
        {isOutOfStock || isLowStock ? (
          <View
            style={[styles.badgePill, { backgroundColor: badgeBg }]}
          >
            <View
              style={[styles.badgeDot, { backgroundColor: badgeColor }]}
            />
            <Text style={[styles.badgeText, { color: badgeColor }]}>
              {isOutOfStock ? "Out of stock" : "Low stock"}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.qtyPill,
              {
                backgroundColor:
                  theme.colors.surfaceSecondary ?? theme.colors.surface,
              },
            ]}
          >
            <Text style={[styles.qtyText, { color: theme.colors.text }]}>
              {product.quantity} {product.unit}
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "transparent",
  },
  thumbnailPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  main: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    marginBottom: 3,
  },
  price: {
    fontSize: 12,
    fontWeight: "600",
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  qtyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
