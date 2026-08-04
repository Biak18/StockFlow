import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeIn, Stagger } from "@/components/motion";
import { Button, ErrorMessage, TextInput } from "@/components/ui";
import { useUIStore } from "@/stores";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../schemas/auth-schemas";
import { authService } from "../services/auth-service";

export function ForgotPasswordForm() {
  const theme = useUIStore((s) => s.theme);
  const insets = useSafeAreaInsets();

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      setLoading(true);
      setFormError(null);
      await authService.resetPassword(values.email.trim());
      setSent(true);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to send reset email",
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
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <Pressable
            onPress={() => router.back()}
            style={styles.back}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
              Back
            </Text>
          </Pressable>

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
              name="key-outline"
              size={24}
              color={theme.colors.primary}
            />
          </View>

          <Text style={[styles.heading, { color: theme.colors.text }]}>
            Reset password
          </Text>
          <Text
            style={[styles.subheading, { color: theme.colors.textSecondary }]}
          >
            Enter your account email and we’ll send a reset link.
          </Text>
        </FadeIn>

        <Stagger baseDelay={80} step={50}>
          <ErrorMessage message={formError} />

          {sent ? (
            <View
              style={[
                styles.successBox,
                {
                  backgroundColor:
                    theme.colors.successMuted ?? theme.colors.surfaceSecondary,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={theme.colors.success}
              />
              <Text
                style={{
                  color: theme.colors.success,
                  flex: 1,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                If an account exists for {getValues("email")}, a reset link is
                on its way. Check your inbox and spam folder.
              </Text>
            </View>
          ) : (
            <>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Email"
                    placeholder="you@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    leftIcon={({ color, size }) => (
                      <Ionicons name="mail-outline" size={size} color={color} />
                    )}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                  />
                )}
              />

              <Button
                title="Send reset link"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                fullWidth
              />
            </>
          )}

          <Pressable
            onPress={() => router.replace("/(auth)/login")}
            style={styles.footer}
            hitSlop={8}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontWeight: "800",
                fontSize: 13,
              }}
            >
              Back to sign in
            </Text>
          </Pressable>
        </Stagger>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20 },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 22,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 22,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  footer: {
    alignItems: "center",
    marginTop: 22,
  },
});
