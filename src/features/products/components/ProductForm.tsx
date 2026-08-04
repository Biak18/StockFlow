import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FormbaseView from "@/components/formbase/formbase";
import { FadeIn, Stagger } from "@/components/motion";
import {
  Button,
  ErrorMessage,
  NumberInput,
  SelectField,
  TextInput,
} from "@/components/ui";
import { getNetworkOnline } from "@/services/network";
import {
  alertDialog,
  useAuthStore,
  useCategoriesStore,
  useSuppliersStore,
  useUIStore,
} from "@/stores";
import { Ionicons } from "@expo/vector-icons";
import {
  productSchema,
  type ProductFormValues,
} from "../schemas/product-schemas";
import { imageService, type PickedImage } from "../services/image-service";
import { BarcodeScannerModal } from "./BarcodeScannerModal";

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  /** Existing remote image path (for edit) */
  existingImagePath?: string | null;
  /** Signed URL for existing image (for edit preview) */
  existingImageUrl?: string | null;
  submitLabel?: string;
  onSubmit: (
    values: ProductFormValues,
    pendingImage: PickedImage | null,
    removeImage: boolean,
  ) => Promise<void>;
}

export function ProductForm({
  defaultValues,
  existingImagePath,
  existingImageUrl,
  submitLabel = "Save Product",
  onSubmit,
}: ProductFormProps) {
  const theme = useUIStore((s) => s.theme);
  const insets = useSafeAreaInsets();

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<PickedImage | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const organization = useAuthStore((s) => s.currentOrganization);
  const categories = useCategoriesStore((s) => s.categories);
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories);
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const fetchSuppliers = useSuppliersStore((s) => s.fetchSuppliers);

  useEffect(() => {
    if (organization?.id) {
      fetchCategories(organization.id);
      fetchSuppliers(organization.id);
    }
  }, [organization?.id, fetchCategories, fetchSuppliers]);

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const supplierOptions = suppliers.map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      barcode: "",
      cost_price: 0,
      selling_price: 0,
      quantity: 0,
      unit: "pcs",
      description: "",
      min_stock_level: 0,
      ...defaultValues,
    },
  });

  const previewUri =
    pendingImage?.uri || (!removeImage ? existingImageUrl : null);

  const handlePickLibrary = async () => {
    try {
      if (!getNetworkOnline()) {
        await alertDialog({
          title: "Offline",
          message: "Images can only be uploaded while online.",
          confirmLabel: "OK",
        });
        return;
      }
      const image = await imageService.pickFromLibrary();
      if (image) {
        setPendingImage(image);
        setRemoveImage(false);
      }
    } catch (err) {
      await alertDialog({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to pick image",
        confirmLabel: "OK",
      });
    }
  };

  const handlePickCamera = async () => {
    try {
      if (!getNetworkOnline()) {
        await alertDialog({
          title: "Offline",
          message: "Images can only be uploaded while online.",
          confirmLabel: "OK",
        });
        return;
      }
      const image = await imageService.pickFromCamera();
      if (image) {
        setPendingImage(image);
        setRemoveImage(false);
      }
    } catch (err) {
      await alertDialog({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to open camera",
        confirmLabel: "OK",
      });
    }
  };

  const handleRemoveImage = () => {
    setPendingImage(null);
    setRemoveImage(true);
  };

  const handleFormSubmit = async (values: ProductFormValues) => {
    try {
      setLoading(true);
      setFormError(null);
      await onSubmit(values, pendingImage, removeImage);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  const isSubmitDisabled = loading || !isDirty;
  return (
    <FormbaseView>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ErrorMessage message={formError} />

        <FadeIn delay={80} duration={300}>
          {/* Image picker */}
          <View style={styles.imageSection}>
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={styles.preview}
                resizeMode="contain"
              />
            ) : (
              <View
                style={[
                  styles.placeholder,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={{ color: theme.colors.textTertiary }}>
                  No image
                </Text>
              </View>
            )}

            <View style={styles.imageActions}>
              <Pressable onPress={handlePickLibrary}>
                <Text
                  style={[styles.imageAction, { color: theme.colors.primary }]}
                >
                  Library
                </Text>
              </Pressable>
              <Pressable onPress={handlePickCamera}>
                <Text
                  style={[styles.imageAction, { color: theme.colors.primary }]}
                >
                  Camera
                </Text>
              </Pressable>
              {(previewUri || existingImagePath) && (
                <Pressable onPress={handleRemoveImage}>
                  <Text
                    style={[styles.imageAction, { color: theme.colors.danger }]}
                  >
                    Remove
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </FadeIn>

        <Stagger baseDelay={80} step={40}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Product name *"
                placeholder="e.g. Wireless Mouse"
                returnKeyType="next"
                submitBehavior="blurAndSubmit"
                leftIcon={({ color, size }) => (
                  <Ionicons name="pricetag-outline" size={size} color={color} />
                )}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="sku"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="SKU"
                placeholder="Optional"
                returnKeyType="next"
                submitBehavior="blurAndSubmit"
                leftIcon={({ color, size }) => (
                  <Ionicons
                    name="file-tray-full-outline"
                    size={size}
                    color={color}
                  />
                )}
                autoCapitalize="characters"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.sku?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="barcode"
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Barcode
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                    }}
                  >
                    <TextInput
                      placeholder="Optional"
                      returnKeyType="next"
                      submitBehavior="blurAndSubmit"
                      leftIcon={({ color, size }) => (
                        <Ionicons
                          name="barcode-outline"
                          size={size}
                          color={color}
                        />
                      )}
                      keyboardType="number-pad"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.barcode?.message}
                      // label is handled above, so don't pass label here
                    />
                  </View>

                  <Pressable
                    onPress={() => setScannerOpen(true)}
                    style={[
                      styles.scanBtn,
                      {
                        backgroundColor:
                          theme.colors.primaryMuted ??
                          theme.colors.surfaceSecondary,
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

                <BarcodeScannerModal
                  visible={scannerOpen}
                  onClose={() => setScannerOpen(false)}
                  title="Scan product barcode"
                  onScanned={(code) => {
                    onChange(code);
                    setScannerOpen(false);
                  }}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="category_id"
            render={({ field: { onChange, value } }) => (
              <SelectField
                label="Category"
                placeholder="Select category"
                options={categoryOptions}
                value={value}
                onChange={onChange}
                error={errors.category_id?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="supplier_id"
            render={({ field: { onChange, value } }) => (
              <SelectField
                label="Supplier"
                placeholder="Select supplier"
                options={supplierOptions}
                value={value}
                onChange={onChange}
                error={errors.supplier_id?.message}
              />
            )}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Controller
                control={control}
                name="cost_price"
                render={({ field: { onChange, onBlur, value } }) => (
                  <NumberInput
                    label="Cost price *"
                    placeholder="0"
                    mode="decimal"
                    maxDecimals={2}
                    returnKeyType="next"
                    submitBehavior="blurAndSubmit"
                    leftIcon={({ color, size }) => (
                      <Ionicons
                        name="pricetags-outline"
                        size={size}
                        color={color}
                      />
                    )}
                    value={value}
                    onChangeValue={onChange}
                    onBlur={onBlur}
                    error={errors.cost_price?.message}
                  />
                )}
              />
            </View>
            <View style={styles.half}>
              <Controller
                control={control}
                name="selling_price"
                render={({ field: { onChange, onBlur, value } }) => (
                  <NumberInput
                    label="Selling price *"
                    placeholder="0"
                    returnKeyType="next"
                    submitBehavior="blurAndSubmit"
                    leftIcon={({ color, size }) => (
                      <Ionicons
                        name="pricetags-outline"
                        size={size}
                        color={color}
                      />
                    )}
                    mode="decimal"
                    maxDecimals={2}
                    onBlur={onBlur}
                    onChangeValue={onChange}
                    value={value}
                    error={errors.selling_price?.message}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Controller
                control={control}
                name="quantity"
                render={({ field: { onChange, onBlur, value } }) => (
                  <NumberInput
                    label="Quantity"
                    placeholder="0"
                    returnKeyType="next"
                    submitBehavior="blurAndSubmit"
                    leftIcon={({ color, size }) => (
                      <Ionicons
                        name="pricetags-outline"
                        size={size}
                        color={color}
                      />
                    )}
                    mode="integer"
                    onBlur={onBlur}
                    onChangeValue={onChange}
                    value={value}
                    error={errors.quantity?.message}
                  />
                )}
              />
            </View>
            <View style={styles.half}>
              <Controller
                control={control}
                name="unit"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Unit"
                    placeholder="pcs"
                    returnKeyType="next"
                    submitBehavior="blurAndSubmit"
                    leftIcon={({ color, size }) => (
                      <Ionicons
                        name="pricetags-outline"
                        size={size}
                        color={color}
                      />
                    )}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.unit?.message}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="min_stock_level"
            render={({ field: { onChange, onBlur, value } }) => (
              <NumberInput
                label="Min stock level"
                placeholder="0"
                returnKeyType="next"
                submitBehavior="blurAndSubmit"
                leftIcon={({ color, size }) => (
                  <Ionicons
                    name="pricetags-outline"
                    size={size}
                    color={color}
                  />
                )}
                mode="decimal"
                maxDecimals={0}
                onBlur={onBlur}
                onChangeValue={onChange}
                value={value}
                error={errors.min_stock_level?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Description"
                placeholder="Optional notes about this product"
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.description?.message}
              />
            )}
          />

          <Button
            title={submitLabel}
            onPress={handleSubmit(handleFormSubmit)}
            loading={loading}
            disabled={isSubmitDisabled}
            fullWidth
            style={{ marginTop: 8 }}
          />
        </Stagger>
      </ScrollView>
    </FormbaseView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16 },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  imageSection: { alignItems: "center", marginBottom: 20 },
  preview: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageActions: {
    flexDirection: "row",
    gap: 20,
    marginTop: 12,
  },
  imageAction: {
    fontSize: 15,
    fontWeight: "600",
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
});
