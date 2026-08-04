import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { FadeIn, Stagger } from "@/components/motion";
import { Button, ErrorMessage, TextInput } from "@/components/ui";
import { useAuthStore, useUIStore } from "@/stores";
import { authService } from "../services/auth-service";

const createOrgSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name is required")
    .max(80, "Name is too long"),
});

type CreateOrgFormValues = z.infer<typeof createOrgSchema>;

export function CreateOrganizationForm() {
  const theme = useUIStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const setOrganization = useAuthStore((s) => s.setOrganization);

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (values: CreateOrgFormValues) => {
    if (!session?.user?.id) {
      setFormError("No active session. Please sign in again.");
      return;
    }

    try {
      setLoading(true);
      setFormError(null);

      const { organization, membership } = await authService.createOrganization(
        values.name.trim(),
        // session.user.id,
      );

      setOrganization(organization, membership);
      router.replace("/(app)");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to create organization",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor:
                  theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
              },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={26}
              color={theme.colors.primary}
            />
          </View>

          <Text style={[styles.heading, { color: theme.colors.text }]}>
            Set up your workspace
          </Text>
          <Text
            style={[styles.subheading, { color: theme.colors.textSecondary }]}
          >
            Create an organization to hold products, stock, and team access.
          </Text>
        </FadeIn>

        <Stagger baseDelay={80} step={55}>
          <ErrorMessage message={formError} />

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Organization name"
                placeholder="e.g. BIAK General Store"
                autoCapitalize="words"
                leftIcon={({ color, size }) => (
                  <Ionicons name="business-outline" size={size} color={color} />
                )}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

          <Button
            title="Create organization"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            style={{ marginTop: 4 }}
          />

          <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
            You can invite teammates later from Settings.
          </Text>
        </Stagger>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    flexGrow: 1,
    justifyContent: "center",
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  hint: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 18,
    lineHeight: 17,
  },
});
