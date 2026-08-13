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
  categorySchema,
  type CategoryFormValues,
} from "@/features/categories/schemas/category-schemas";
import { categoryRepository } from "@/features/categories/services/category-repository";
import type { Category } from "@/features/categories/types";
import { useAuthStore, useCategoriesStore, useUIStore } from "@/stores";

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
        <Ionicons name="close" size={26} color={textColor} />
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

export default function EditCategoryScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const categories = useCategoriesStore((s) => s.categories);
  const updateCategory = useCategoriesStore((s) => s.updateCategory);
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    mode: "onChange",
    defaultValues: { name: "", description: "" },
  });

  // Load category data
  useEffect(() => {
    const local = categories.find((c) => c.id === id);
    if (local) {
      setCategory(local);
      reset({
        name: local.name,
        description: local.description ?? "",
      });
    }
    setLoading(false);
  }, [id, categories, reset]);

  // Clear server-side error as soon as the user edits anything
  const currentName = watch("name");
  const currentDesc = watch("description");
  useEffect(() => {
    if (formError) setFormError(null);
  }, [currentName, currentDesc, formError]);

  const onSubmit = useCallback(
    async (values: CategoryFormValues) => {
      if (!organization?.id || !category) {
        setFormError("No organization selected");
        return;
      }

      try {
        setSaving(true);
        setFormError(null);

        const updated = await categoryRepository.update(
          category.id,
          organization.id,
          {
            name: values.name.trim(),
            description: values.description?.trim() || null,
          },
        );

        updateCategory(category.id, updated);
        router.back();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update category";
        setFormError(message);
      } finally {
        setSaving(false);
      }
    },
    [organization?.id, category, updateCategory],
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

  if (!category) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.notFoundText, { color: theme.colors.danger }]}>
          Category not found
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
          title="Edit category"
          textColor={theme.colors.textSecondary}
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
                  placeholder="e.g. Electronics"
                  returnKeyType="next"
                  submitBehavior="blurAndSubmit"
                  leftIcon={({ color, size }) => (
                    <Ionicons
                      name="pricetag-outline"
                      size={size}
                      color={color}
                    />
                  )}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                  accessibilityLabel="Category name input"
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Description"
                  placeholder="Optional details"
                  returnKeyType="done"
                  submitBehavior="blurAndSubmit"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.description?.message}
                  accessibilityLabel="Category description input"
                  multiline
                  numberOfLines={3}
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
