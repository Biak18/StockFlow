import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { Button, ErrorMessage, TextInput } from "@/components/ui";
import {
  supplierSchema,
  type SupplierFormValues,
} from "@/features/suppliers/schemas/supplier-schemas";
import { supplierRepository } from "@/features/suppliers/services/supplier-repository";
import type { Supplier } from "@/features/suppliers/types";
import { useAuthStore, useSuppliersStore, useUIStore } from "@/stores";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function Header({
  onClose,
  title,
  textColor,
}: {
  onClose: () => void;
  title: string;
  textColor: string;
}) {
  return (
    <View style={[styles.header, { paddingTop: 8 }]}>
      <Pressable
        onPress={onClose}
        style={styles.headerSide}
        hitSlop={12}
        accessibilityLabel="Close screen"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={22} color={textColor} />
      </Pressable>

      <Text
        style={[styles.headerTitle, { color: textColor }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={styles.headerSide} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Screen                                                       */
/* ------------------------------------------------------------------ */

export default function EditSupplierScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const updateSupplier = useSuppliersStore((s) => s.updateSupplier);
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  // Load supplier data
  useEffect(() => {
    const local = suppliers.find((s) => s.id === id);
    if (local) {
      setSupplier(local);
      reset({
        name: local.name,
        email: local.email ?? "",
        phone: local.phone ?? "",
        address: local.address ?? "",
        notes: local.notes ?? "",
      });
    }
    setLoading(false);
  }, [id, suppliers, reset]);

  // Clear server-side error as soon as the user edits anything
  const currentName = watch("name");
  const currentEmail = watch("email");
  const currentPhone = watch("phone");
  const currentAddress = watch("address");
  const currentNotes = watch("notes");
  useEffect(() => {
    if (formError) setFormError(null);
  }, [
    currentName,
    currentEmail,
    currentPhone,
    currentAddress,
    currentNotes,
    formError,
  ]);

  const onSubmit = useCallback(
    async (values: SupplierFormValues) => {
      if (!organization?.id || !supplier) {
        setFormError("No organization selected");
        return;
      }

      try {
        setSaving(true);
        setFormError(null);

        const updated = await supplierRepository.update(
          supplier.id,
          organization.id,
          {
            name: values.name.trim(),
            email: values.email?.trim() || null,
            phone: values.phone?.trim() || null,
            address: values.address?.trim() || null,
            notes: values.notes?.trim() || null,
          },
        );

        updateSupplier(supplier.id, updated);
        router.back();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update supplier";
        setFormError(message);
      } finally {
        setSaving(false);
      }
    },
    [organization?.id, supplier, updateSupplier],
  );

  const handleClose = useCallback(() => router.back(), []);

  const isSubmitDisabled = saving || !isDirty;

  /* --------------------------- Loading ------------------------------ */

  if (loading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  /* --------------------------- Not Found ---------------------------- */

  if (!supplier) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.notFoundText, { color: theme.colors.danger }]}>
          Supplier not found
        </Text>
        <Button title="Go back" onPress={handleClose} />
      </View>
    );
  }

  /* --------------------------- Form --------------------------------- */

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FadeIn delay={80} duration={300}>
        <Header
          onClose={handleClose}
          title="Edit supplier"
          textColor={theme.colors.text}
        />
      </FadeIn>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeIn delay={80} duration={300}>
            <ErrorMessage message={formError} />
          </FadeIn>

          <Stagger baseDelay={80} step={40}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Name"
                  placeholder="e.g. Northstar Supply Co."
                  returnKeyType="next"
                  submitBehavior="blurAndSubmit"
                  leftIcon={({ color, size }) => (
                    <Ionicons
                      name="business-outline"
                      size={size}
                      color={color}
                    />
                  )}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                  accessibilityLabel="Supplier name input"
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email"
                  placeholder="orders@supplier.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  submitBehavior="blurAndSubmit"
                  leftIcon={({ color, size }) => (
                    <Ionicons name="mail-outline" size={size} color={color} />
                  )}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                  accessibilityLabel="Supplier email input"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Phone"
                  placeholder="+1 555 000 0000"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  returnKeyType="next"
                  submitBehavior="blurAndSubmit"
                  leftIcon={({ color, size }) => (
                    <Ionicons name="call-outline" size={size} color={color} />
                  )}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.phone?.message}
                  accessibilityLabel="Supplier phone input"
                />
              )}
            />
            <Button
              title="Save changes"
              onPress={handleSubmit(onSubmit)}
              loading={saving}
              disabled={isSubmitDisabled}
              fullWidth
              style={styles.submitButton}
            />
          </Stagger>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerSide: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  hero: {
    marginBottom: 24,
    marginTop: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  submitButton: {
    marginTop: 12,
  },
});
