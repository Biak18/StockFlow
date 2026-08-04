import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
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
  SupplierFormValues,
  supplierSchema,
  supplierService,
} from "@/features/suppliers";
import { useAuthStore, useSuppliersStore, useUIStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Main Screen                                                       */
/* ------------------------------------------------------------------ */

export default function CreateSupplierScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const addSupplier = useSuppliersStore((s) => s.addSupplier);
  const insets = useSafeAreaInsets();

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    mode: "onChange",
    defaultValues: { name: "", email: "", phone: "" },
  });

  // Clear server-side error as soon as the user edits anything
  const currentName = watch("name");
  const currentEmail = watch("email");
  const currentPhone = watch("phone");
  useEffect(() => {
    if (formError) setFormError(null);
  }, [currentName, currentEmail, currentPhone, formError]);

  const onSubmit = useCallback(
    async (values: SupplierFormValues) => {
      if (!organization?.id) {
        setFormError("No organization selected");
        return;
      }

      try {
        setLoading(true);
        setFormError(null);

        const supplier = await supplierService.create({
          organization_id: organization.id,
          name: values.name.trim(),
          email: values.email?.trim() || null,
          phone: values.phone?.trim() || null,
        });

        addSupplier(supplier);
        reset();
        router.back();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create supplier";
        setFormError(message);
      } finally {
        setLoading(false);
      }
    },
    [organization?.id, addSupplier, reset],
  );

  const handleClose = useCallback(() => router.back(), []);

  const isSubmitDisabled = loading || !isDirty;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FadeIn delay={80} duration={300}>
        <View style={[styles.header, { paddingTop: 8 }]}>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            accessibilityLabel="Cancel"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </Pressable>

          <Text
            style={[styles.headerTitle, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            New Supplier
          </Text>

          <View style={styles.headerSide} />
        </View>
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
                  placeholder="e.g. Acme Supplies"
                  returnKeyType="next"
                  submitBehavior="blurAndSubmit"
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
                  placeholder="supplier@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                  submitBehavior="blurAndSubmit"
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
                  placeholder="+1 (555) 000-0000"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  returnKeyType="done"
                  submitBehavior="blurAndSubmit"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.phone?.message}
                  accessibilityLabel="Supplier phone input"
                />
              )}
            />

            <Button
              title="Create Supplier"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  headerSide: { width: 50 },
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
