import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

import FormbaseView from "@/components/formbase/formbase";
import { FadeIn } from "@/components/motion";
import { Button, ErrorMessage, TextInput } from "@/components/ui";
import type { InviteRole, OrganizationInvite } from "@/features/team";
import { inviteService } from "@/features/team";
import { alertDialog, confirmDialog, useAuthStore, useUIStore } from "@/stores";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["member", "admin"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function TeamScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const session = useAuthStore((s) => s.session);
  const role = useAuthStore((s) => s.role);
  const insets = useSafeAreaInsets();

  const canInvite = role === "owner" || role === "admin";

  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member" },
  });

  const load = useCallback(async () => {
    if (!organization?.id) return;
    try {
      setLoading(true);
      const data = await inviteService.list(organization.id);
      setInvites(data);
    } catch (err) {
      await alertDialog({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to load invites",
      });
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onInvite = async (values: InviteFormValues) => {
    if (!organization?.id || !session?.user?.id) return;

    try {
      setSubmitting(true);
      setFormError(null);

      await inviteService.create({
        organizationId: organization.id,
        email: values.email,
        role: values.role as InviteRole,
        invitedBy: session.user.id,
      });

      reset({ email: "", role: "member" });
      await load();
      await alertDialog({
        title: "Invite created",
        message:
          "When this person registers or signs in with that email, they will join your organization automatically.",
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setSubmitting(false);
    }
  };

  const onRevoke = async (invite: OrganizationInvite) => {
    if (!organization?.id) return;

    const ok = await confirmDialog({
      title: "Revoke invite?",
      message: `Revoke pending invite for ${invite.email}?`,
      confirmLabel: "Revoke",
      destructive: true,
    });
    if (!ok) return;

    try {
      await inviteService.revoke(invite.id, organization.id);
      await load();
    } catch (err) {
      await alertDialog({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to revoke",
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FadeIn>
        <View style={[styles.topBar]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.side}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
          <Text
            style={[styles.topTitle, { color: theme.colors.textSecondary }]}
          >
            Team
          </Text>
          <View style={styles.side} />
        </View>
      </FadeIn>

      <FormbaseView>
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
          }}
          ListHeaderComponent={
            <View>
              <Text style={[styles.heading, { color: theme.colors.text }]}>
                Team & invites
              </Text>
              <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
                Invite people by email. They join this workspace when they sign
                in.
              </Text>

              {canInvite ? (
                <View style={{ marginTop: 16, marginBottom: 8 }}>
                  <ErrorMessage message={formError} />
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Email"
                        placeholder="colleague@company.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        leftIcon={({ color, size }) => (
                          <Ionicons
                            name="mail-outline"
                            size={size}
                            color={color}
                          />
                        )}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.email?.message}
                      />
                    )}
                  />

                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 12,
                      fontWeight: "700",
                      marginBottom: 8,
                    }}
                  >
                    Role
                  </Text>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field: { value, onChange } }) => (
                      <View style={styles.roleRow}>
                        {(["member", "admin"] as const).map((r) => {
                          const active = value === r;
                          return (
                            <Pressable
                              key={r}
                              onPress={() => onChange(r)}
                              style={[
                                styles.roleChip,
                                {
                                  backgroundColor: active
                                    ? (theme.colors.primaryMuted ??
                                      theme.colors.surfaceSecondary)
                                    : theme.colors.surfaceSecondary,
                                  borderColor: active
                                    ? theme.colors.primary
                                    : theme.colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  color: active
                                    ? theme.colors.primary
                                    : theme.colors.textSecondary,
                                  fontWeight: "700",
                                  fontSize: 13,
                                  textTransform: "capitalize",
                                }}
                              >
                                {r}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  />

                  <Button
                    title="Send invite"
                    onPress={handleSubmit(onInvite)}
                    loading={submitting}
                    fullWidth
                    style={{ marginTop: 8, marginBottom: 20 }}
                  />
                </View>
              ) : (
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    marginVertical: 16,
                    fontSize: 13,
                  }}
                >
                  Only owners and admins can invite teammates.
                </Text>
              )}

              <Text style={[styles.section, { color: theme.colors.text }]}>
                Invites
              </Text>
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                No invites yet.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.inviteRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
                  {item.email}
                </Text>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {item.role} · {item.status}
                  {item.status === "pending"
                    ? ` · expires ${new Date(item.expires_at).toLocaleDateString()}`
                    : ""}
                </Text>
              </View>
              {canInvite && item.status === "pending" ? (
                <Pressable onPress={() => onRevoke(item)} hitSlop={8}>
                  <Text
                    style={{ color: theme.colors.danger, fontWeight: "700" }}
                  >
                    Revoke
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />
      </FormbaseView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  side: { width: 72 },
  topTitle: { fontSize: 15, fontWeight: "600" },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  section: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
});
