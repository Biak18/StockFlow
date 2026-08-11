import { router, useLocalSearchParams, useSegments } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { FadeIn } from "@/components/motion/FadeIn";
import { ProductForm } from "@/features/products/components/ProductForm";
import type { ProductFormValues } from "@/features/products/schemas/product-schemas";
import {
  imageService,
  type PickedImage,
} from "@/features/products/services/image-service";
import { persistLocalProductImage } from "@/features/products/services/local-image";
import { productRepository } from "@/features/products/services/product-repository";
import { getNetworkOnline } from "@/services/network";
import { syncQueue } from "@/services/sync/sync-queue";
import { useAuthStore, useProductsStore, useUIStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";

export default function CreateProductScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const addProduct = useProductsStore((s) => s.addProduct);
  const updateProduct = useProductsStore((s) => s.updateProduct);
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { barcode: prefillBarcode } = useLocalSearchParams<{
    barcode?: string;
  }>();

  const handleSubmit = async (
    values: ProductFormValues,
    pendingImage: PickedImage | null,
    _removeImage: boolean,
  ) => {
    if (!organization?.id) {
      throw new Error("No organization selected");
    }

    let product = await productRepository.create({
      organization_id: organization.id,
      name: values.name.trim(),
      sku: values.sku?.trim() || null,
      barcode: values.barcode?.trim() || null,
      category_id: values.category_id ?? null,
      supplier_id: values.supplier_id ?? null,
      cost_price: values.cost_price,
      selling_price: values.selling_price,
      quantity: values.quantity ?? 0,
      unit: values.unit || "pcs",
      description: values.description?.trim() || null,
      min_stock_level: values.min_stock_level ?? 0,
      image_path: null,
    });

    addProduct(product);

    if (pendingImage) {
      if (!getNetworkOnline()) {
        const localUri = await persistLocalProductImage(
          product.id,
          pendingImage.uri,
          pendingImage.fileName?.split(".").pop() ?? "jpg",
        );

        await syncQueue.enqueue({
          tableName: "product_images",
          recordId: product.id,
          operation: "update",
          payload: {
            product_id: product.id,
            organization_id: organization.id,
            local_uri: localUri,
            mime_type: pendingImage.mimeType ?? "image/jpeg",
            file_name: pendingImage.fileName ?? `product-${product.id}.jpg`,
          },
        });

        // optional: show local preview from store
        // updateProduct(product.id, {
        //   local_image_uri: localUri,
        // } as any);
      } else {
        const path = await imageService.upload(
          organization.id,
          product.id,
          pendingImage,
        );
        product = await productRepository.update(product.id, organization.id, {
          image_path: path,
        });
        updateProduct(product.id, { image_path: path });
      }
    }

    // router.back();
    router.replace("/(app)/products");
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FadeIn>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.replace("/(app)/products")}
            style={styles.iconBtn}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>
          <Text
            style={[styles.topLabel, { color: theme.colors.textSecondary }]}
          >
            Add new product
          </Text>
          <View style={[styles.iconBtn, { marginRight: 8 }]} />
        </View>
      </FadeIn>

      <ProductForm
        submitLabel="Create product"
        onSubmit={handleSubmit}
        defaultValues={{
          barcode: prefillBarcode ?? "",
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
