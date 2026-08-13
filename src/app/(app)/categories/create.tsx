import { Ionicons } from "@expo/vector-icons";
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
  categorySchema,
  type CategoryFormValues,
} from "@/features/categories/schemas/category-schemas";
import { categoryRepository } from "@/features/categories/services/category-repository";
import { useAuthStore, useCategoriesStore, useUIStore } from "@/stores";

/* ------------------------------------------------------------------ */
/*  Sub-components (kept in-file for portability)                     */
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
    <View style={styles.header}>
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

export default function CreateCategoryScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const addCategory = useCategoriesStore((s) => s.addCategory);
  const insets = useSafeAreaInsets();

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    mode: "onChange", // Real-time validation for immediate feedback
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Clear server-side error as soon as the user edits anything
  const currentName = watch("name");
  const currentDesc = watch("description");
  useEffect(() => {
    if (formError) setFormError(null);
  }, [currentName, currentDesc, formError]);

  const onSubmit = useCallback(
    async (values: CategoryFormValues) => {
      if (!organization?.id) {
        setFormError("No organization selected");
        return;
      }

      try {
        setLoading(true);
        setFormError(null);

        const category = await categoryRepository.create(organization.id, {
          name: values.name.trim(),
          description: values.description?.trim() || null,
        });

        addCategory(category);
        reset(); // Clean form state before leaving
        router.back();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create category";
        setFormError(message);
      } finally {
        setLoading(false);
      }
    },
    [organization?.id, addCategory, reset],
  );

  const handleClose = useCallback(() => router.back(), []);

  const isSubmitDisabled = loading || !isDirty;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FadeIn delay={80} duration={300}>
        <Header
          onClose={handleClose}
          title="New category"
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
                  placeholder="Optional details about this category"
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
              title="Create category"
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
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
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
