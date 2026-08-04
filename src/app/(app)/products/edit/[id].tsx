import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui";
import { ProductForm } from "@/features/products/components/ProductForm";
import { useProduct } from "@/features/products/hooks/useProduct";
import type { ProductFormValues } from "@/features/products/schemas/product-schemas";
import {
  imageService,
  type PickedImage,
} from "@/features/products/services/image-service";
import { productRepository } from "@/features/products/services/product-repository";
import { getNetworkOnline } from "@/services/network";
import { useAuthStore, useProductsStore, useUIStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";

export default function EditProductScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const updateProductInStore = useProductsStore((s) => s.updateProduct);
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, loading, error } = useProduct(id);

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUrl() {
      if (product?.image_path) {
        const url = await imageService.getSignedUrl(product.image_path);
        if (!cancelled) setExistingImageUrl(url);
      } else {
        setExistingImageUrl(null);
      }
    }

    loadUrl();
    return () => {
      cancelled = true;
    };
  }, [product?.image_path]);

  const handleSubmit = async (
    values: ProductFormValues,
    pendingImage: PickedImage | null,
    removeImage: boolean,
  ) => {
    if (!organization?.id || !product) {
      throw new Error("Missing product or organization");
    }

    let imagePath = product.image_path;

    if (removeImage && imagePath) {
      if (getNetworkOnline()) {
        try {
          await imageService.remove(imagePath);
        } catch {
          // continue
        }
      }
      imagePath = null;
    }

    if (pendingImage) {
      if (!getNetworkOnline()) {
        throw new Error("Images can only be uploaded while online");
      }
      if (imagePath) {
        try {
          await imageService.remove(imagePath);
        } catch {
          // continue
        }
      }
      imagePath = await imageService.upload(
        organization.id,
        product.id,
        pendingImage,
      );
    }

    const updated = await productRepository.update(
      product.id,
      organization.id,
      {
        name: values.name.trim(),
        sku: values.sku?.trim() || null,
        barcode: values.barcode?.trim() || null,
        category_id: values.category_id ?? null,
        supplier_id: values.supplier_id ?? null,
        cost_price: values.cost_price,
        selling_price: values.selling_price,
        quantity: values.quantity,
        unit: values.unit || "pcs",
        description: values.description?.trim() || null,
        min_stock_level: values.min_stock_level,
        image_path: imagePath,
      },
    );

    updateProductInStore(product.id, updated);
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
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FadeIn>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconBtn}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text
            style={[styles.topLabel, { color: theme.colors.textSecondary }]}
          >
            Edit product
          </Text>
          <View style={[styles.iconBtn, { marginRight: 8 }]} />
        </View>
      </FadeIn>

      <ProductForm
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        existingImagePath={product.image_path}
        existingImageUrl={existingImageUrl}
        defaultValues={{
          name: product.name,
          sku: product.sku ?? "",
          barcode: product.barcode ?? "",
          category_id: product.category_id,
          supplier_id: product.supplier_id,
          cost_price: product.cost_price,
          selling_price: product.selling_price,
          quantity: product.quantity,
          unit: product.unit,
          description: product.description ?? "",
          min_stock_level: product.min_stock_level,
        }}
      />
    </SafeAreaView>
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
    marginBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  topLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
});
