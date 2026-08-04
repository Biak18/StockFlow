import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { FadeIn, Stagger } from "@/components/motion";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { syncEngine } from "@/services/sync/sync-engine";
import { alertDialog, confirmDialog, useAuthStore, useUIStore } from "@/stores";

type ThemeMode = "light" | "dark" | "system";

function getInitials(name?: string | null) {
  if (!name?.trim()) return "SF";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}) {
  const theme = useUIStore((s) => s.theme);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !right}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          opacity: pressed && onPress ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={danger ? theme.colors.danger : theme.colors.textSecondary}
      />
      <View style={styles.rowCopy}>
        <Text
          style={[
            styles.rowTitle,
            { color: danger ? theme.colors.danger : theme.colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.textTertiary}
          />
        ) : null)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const theme = useUIStore((s) => s.theme);
  const themeMode = useUIStore((s) => s.themeMode);
  const setThemeMode = useUIStore((s) => s.setThemeMode);
  const isOnline = useUIStore((s) => s.isOnline);
  const isSyncing = useUIStore((s) => s.isSyncing);

  const profile = useAuthStore((s) => s.profile);
  const organization = useAuthStore((s) => s.currentOrganization);
  const role = useAuthStore((s) => s.role);

  const insets = useSafeAreaInsets();
  const { signOut, loading: signingOut } = useSignOut();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const count = await syncEngine.pendingCount();
        if (mounted) setPendingCount(count);
      } catch {
        // ignore
      }
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isOnline, isSyncing]);

  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  const syncSubtitle = !isOnline
    ? "Offline"
    : isSyncing
      ? "Syncing…"
      : pendingCount > 0
        ? `${pendingCount} pending`
        : "Up to date";

  const handleSignOut = async () => {
    const ok = await confirmDialog({
      title: "Sign out",
      message: "Are you sure you want to sign out?",
      confirmLabel: "Sign out",
      destructive: true,
    });
    if (ok) await signOut();
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      await alertDialog({
        title: "Offline",
        message: "Connect to the internet to sync.",
      });
      return;
    }
    await syncEngine.flush();
    const count = await syncEngine.pendingCount();
    setPendingCount(count);
  };

  const cycleTheme = () => {
    const order: ThemeMode[] = ["system", "light", "dark"];
    const next =
      order[(order.indexOf(themeMode as ThemeMode) + 1) % order.length];
    setThemeMode(next);
  };

  const themeLabel =
    themeMode === "system" ? "System" : themeMode === "dark" ? "Dark" : "Light";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{
          // paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          {/* <Text style={[styles.eyebrow, { color: theme.colors.textSecondary }]}>
            Workspace
          </Text> */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Settings
          </Text>
        </FadeIn>

        <Stagger baseDelay={40} step={40}>
          {/* Profile card */}
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor:
                  theme.colors.surfaceSecondary ?? theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    theme.colors.primaryMuted ?? theme.colors.surface,
                },
              ]}
            >
              <Text style={{ color: theme.colors.primary, fontWeight: "800" }}>
                {getInitials(profile?.full_name)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>
                {profile?.full_name ?? "User"}
              </Text>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: 12,
                  marginTop: 3,
                }}
              >
                {(role ?? "member").toString()} · {organization?.name ?? "—"}
              </Text>
              {profile?.email ? (
                <Text
                  style={{
                    color: theme.colors.textTertiary,
                    fontSize: 11,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {profile.email}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Data */}
          <Text
            style={[styles.groupLabel, { color: theme.colors.textTertiary }]}
          >
            Data
          </Text>
          <View
            style={[
              styles.group,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <SettingsRow
              icon="grid-outline"
              title="Categories"
              subtitle="Organize your catalog"
              onPress={() => router.push("/(app)/categories")}
            />
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <SettingsRow
              icon="business-outline"
              title="Suppliers"
              subtitle="Vendor contacts"
              onPress={() => router.push("/(app)/suppliers")}
            />
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <SettingsRow
              icon="bar-chart-outline"
              title="Reports & export"
              subtitle="Valuation, low stock, CSV"
              onPress={() => router.push("/(app)/settings/reports")}
            />
          </View>

          {/* Preferences */}
          <Text
            style={[styles.groupLabel, { color: theme.colors.textTertiary }]}
          >
            Preferences
          </Text>
          <View
            style={[
              styles.group,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <SettingsRow
              icon="moon-outline"
              title="Appearance"
              subtitle={themeLabel}
              onPress={cycleTheme}
              right={
                <Switch
                  value={theme.mode === "dark"}
                  onValueChange={(dark) =>
                    setThemeMode(dark ? "dark" : "light")
                  }
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                />
              }
            />
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <SettingsRow
              icon="cloud-outline"
              title="Backup & sync"
              subtitle={syncSubtitle}
              onPress={handleSyncNow}
            />
          </View>

          <SettingsRow
            icon="people-outline"
            title="Team & invites"
            subtitle="Invite teammates by email"
            onPress={() => router.push("/(app)/settings/team")}
          />

          {/* Account */}
          <Text
            style={[styles.groupLabel, { color: theme.colors.textTertiary }]}
          >
            Account
          </Text>
          <View
            style={[
              styles.group,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <SettingsRow
              icon="information-circle-outline"
              title="About StockFlow"
              subtitle={`Version ${version}`}
            />
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <SettingsRow
              icon="log-out-outline"
              title={signingOut ? "Signing out…" : "Sign out"}
              onPress={handleSignOut}
              danger
            />
          </View>

          <Text style={[styles.footer, { color: theme.colors.textTertiary }]}>
            StockFlow · practical inventory control
          </Text>
        </Stagger>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginBottom: 18,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 22,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 15,
    fontWeight: "800",
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  group: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  row: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  rowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44,
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
});
