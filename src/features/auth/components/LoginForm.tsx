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
import { loginSchema, type LoginFormValues } from "../schemas/auth-schemas";
import { authService } from "../services/auth-service";
import { resolveWorkspace } from "../services/resolve-workspace";

export function LoginForm() {
  const theme = useUIStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setOrganization = useAuthStore((s) => s.setOrganization);

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      setFormError(null);
      useAuthStore.getState().setResolvingOrg(true);

      const { session, user } = await authService.signIn(values);

      setSession(session);

      const profile = await authService.getProfile(user.id);
      if (profile) setProfile(profile);
      const workspace = await resolveWorkspace(user.id);

      if (!workspace) {
        useAuthStore.getState().setResolvingOrg(false);
        router.replace("/(auth)/create-organization");
        return;
      }

      // const membership = await authService.getMembership(user.id);

      // if (!membership) {
      //   router.replace("/(auth)/create-organization");
      //   return;
      // }

      // setOrganization(membership.organization, membership.membership);
      setOrganization(workspace.organization, workspace.membership);
      useAuthStore.getState().setResolvingOrg(false);
      router.replace("/(app)");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to sign in");
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
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <View style={styles.brandRow}>
            <View
              style={[
                styles.brandMark,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Ionicons name="cube" size={22} color="#fff" />
            </View>
            <View>
              <Text style={[styles.brandName, { color: theme.colors.text }]}>
                StockFlow
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                Inventory for growing businesses
              </Text>
            </View>
          </View>

          <Text style={[styles.heading, { color: theme.colors.text }]}>
            Welcome back
          </Text>
          <Text
            style={[styles.subheading, { color: theme.colors.textSecondary }]}
          >
            Sign in to continue to your workspace
          </Text>
        </FadeIn>

        <Stagger baseDelay={90} step={55}>
          <ErrorMessage message={formError} />

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
                placeholder="Your password"
                isPassword
                autoComplete="password"
                textContentType="password"
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

          <Pressable
            onPress={() => router.push("/(auth)/forgot-password")}
            style={styles.forgot}
            hitSlop={8}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              Forgot password?
            </Text>
          </Pressable>

          <Button
            title="Sign in"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
          />

          <View style={styles.footerRow}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
              Don’t have an account?
            </Text>
            <Pressable
              onPress={() => router.push("/(auth)/register")}
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
                Create one
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
    flexGrow: 1,
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    marginBottom: 22,
    lineHeight: 20,
  },
  forgot: {
    alignSelf: "flex-end",
    marginBottom: 16,
    marginTop: -4,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
});
