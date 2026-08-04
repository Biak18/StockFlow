import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FormbaseView from "@/components/formbase/formbase";
import { FadeIn, Stagger } from "@/components/motion";
import { Button, ErrorMessage, TextInput } from "@/components/ui";
import { useAuthStore, useUIStore } from "@/stores";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/auth-schemas";
import { authService } from "../services/auth-service";

export function RegisterForm() {
  const theme = useUIStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setLoading(true);
      setFormError(null);
      setInfoMessage(null);

      const result = await authService.signUp(values);

      if (!result.user) {
        throw new Error("Unable to create account");
      }

      // If email confirmation is required, session may be null
      if (!result.session) {
        setInfoMessage(
          "Account created. Check your email to confirm, then sign in.",
        );
        return;
      }

      setSession(result.session);

      const profile = await authService.getProfile(result.user.id);
      if (profile) setProfile(profile);

      // New users typically have no org yet
      router.replace("/(auth)/create-organization");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to create account",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormbaseView>
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

          <View style={styles.brandRow}>
            <View
              style={[
                styles.brandMark,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Ionicons name="cube" size={20} color="#fff" />
            </View>
            <Text style={[styles.brandName, { color: theme.colors.text }]}>
              StockFlow
            </Text>
          </View>

          <Text style={[styles.heading, { color: theme.colors.text }]}>
            Create account
          </Text>
          <Text
            style={[styles.subheading, { color: theme.colors.textSecondary }]}
          >
            Start tracking inventory in a few steps
          </Text>
        </FadeIn>

        <Stagger baseDelay={70} step={50}>
          <ErrorMessage message={formError} />

          {infoMessage ? (
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor:
                    theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={theme.colors.primary}
              />
              <Text
                style={{ color: theme.colors.primary, flex: 1, fontSize: 13 }}
              >
                {infoMessage}
              </Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Full name"
                placeholder="Your name"
                autoCapitalize="words"
                textContentType="name"
                leftIcon={({ color, size }) => (
                  <Ionicons name="person-outline" size={size} color={color} />
                )}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.fullName?.message}
              />
            )}
          />

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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Password"
                placeholder="Min 6 chars, upper + special"
                isPassword
                textContentType="newPassword"
                leftIcon={({ color, size }) => (
                  <Ionicons
                    name="lock-closed-outline"
                    size={size}
                    color={color}
                  />
                )}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Confirm password"
                placeholder="Repeat password"
                isPassword
                textContentType="newPassword"
                leftIcon={({ color, size }) => (
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={size}
                    color={color}
                  />
                )}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            title="Create account"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            style={{ marginTop: 4 }}
          />

          <View style={styles.footerRow}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
              Already have an account?
            </Text>
            <Pressable
              onPress={() => router.replace("/(auth)/login")}
              hitSlop={8}
            >
              <Text
                style={{
                  color: theme.colors.primary,
                  fontWeight: "800",
                  fontSize: 13,
                }}
              >
                {" "}
                Sign in
              </Text>
            </Pressable>
          </View>
        </Stagger>
      </ScrollView>
    </FormbaseView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 20,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 17,
    fontWeight: "800",
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
});
