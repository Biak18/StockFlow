import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
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
import { PressableScale } from "@/components/ui/PressableScale";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { resetLocalData } from "@/services/database/reset-local";
import {
  clearLowStockNotifHash,
  ensureNotificationPermission,
  getLowStockNotifEnabled,
  notifyLowStockIfNeeded,
  setLowStockNotifEnabled,
} from "@/services/notifications/low-stock";
import { syncEngine } from "@/services/sync/sync-engine";
import {
  alertDialog,
  confirmDialog,
  useAuthStore,
  useCategoriesStore,
  useProductsStore,
  useSuppliersStore,
  useUIStore,
} from "@/stores";

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
  const tint = danger ? theme.colors.danger : theme.colors.primary;

  const row = (
    <View
      style={[
        styles.rowInner,
        onPress && !right ? styles.rowPressable : null,
      ]}
    >
      <View
        style={[
          styles.iconBubble,
          {
            backgroundColor:
              danger
                ? (theme.colors.dangerMuted ?? theme.colors.surfaceSecondary)
                : (theme.colors.primaryMuted ?? theme.colors.surfaceSecondary),
          },
        ]}
      >
        <Ionicons name={icon} size={16} color={tint} />
      </View>
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
    </View>
  );

  if (!onPress) {
    return <View style={[styles.row, { backgroundColor: theme.colors.surface }]}>{row}</View>;
  }

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      haptic="light"
      style={[styles.row, { backgroundColor: theme.colors.surface }]}
    >
      {row}
    </PressableScale>
  );
}

export default function SettingsScreen() {
  const theme = useUIStore((s) => s.theme);
  const themeMode = useUIStore((s) => s.themeMode);
  const setThemeMode = useUIStore((s) => s.setThemeMode);
  const isOnline = useUIStore((s) => s.isOnline);
  const isSyncing = useUIStore((s) => s.isSyncing);
  const fetchProducts = useProductsStore((p) => p.fetchProducts);
  const fetchCategories = useCategoriesStore((c) => c.fetchCategories);
  const fetchSuppliers = useSuppliersStore((s) => s.fetchSuppliers);

  const profile = useAuthStore((s) => s.profile);
  const organization = useAuthStore((s) => s.currentOrganization);
  const role = useAuthStore((s) => s.role);

  const insets = useSafeAreaInsets();
  const { signOut, loading: signingOut } = useSignOut();
  const [pendingCount, setPendingCount] = useState(0);

  const [lowStockOn, setLowStockOn] = useState(true);

  useEffect(() => {
    getLowStockNotifEnabled().then(setLowStockOn);
  }, []);

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

  const handleReset = async () => {
    const ok = await confirmDialog({
      title: "Reset offline data?",
      message:
        "Clears the local cache and sync queue on this device. Cloud data is not deleted. The app will reload data from the server if you are online.",
      confirmLabel: "Reset",
      destructive: true,
    });

    if (!ok) return;

    await resetLocalData();

    if (organization?.id && isOnline) {
      await fetchProducts(organization.id, { force: true });
      await fetchCategories(organization.id);
      await fetchSuppliers(organization.id);
    }
  };

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
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Settings
          </Text>
        </FadeIn>

        <Stagger baseDelay={40} step={40}>
          {/* Profile hero */}
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: theme.colors.primary,
                ...theme.shadows.md,
              },
            ]}
          >
            <View
              style={[
                styles.orb,
                styles.orbLg,
                { backgroundColor: "rgba(255,255,255,0.12)" },
              ]}
            />
            <View
              style={[
                styles.orb,
                styles.orbSm,
                { backgroundColor: "rgba(255,255,255,0.16)" },
              ]}
            />
            <View
              style={[
                styles.avatar,
                { backgroundColor: "rgba(255,255,255,0.22)" },
              ]}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                {getInitials(profile?.full_name)}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.profileName, { color: "#fff" }]}>
                {profile?.full_name ?? "User"}
              </Text>
              <Text style={styles.profileMeta}>
                {(role ?? "member").toString()} · {organization?.name ?? "—"}
              </Text>
              {profile?.email ? (
                <Text style={styles.profileEmail} numberOfLines={1}>
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
                ...theme.shadows.sm,
              },
            ]}
          >
            <SettingsRow
              icon="shapes-outline"
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
                ...theme.shadows.sm,
              },
            ]}
          >
            <SettingsRow
              icon="notifications-outline"
              title="Low stock alerts"
              subtitle={lowStockOn ? "On" : "Off"}
              right={
                <Switch
                  value={lowStockOn}
                  onValueChange={async (v) => {
                    setLowStockOn(v);
                    await setLowStockNotifEnabled(v);
                    if (v) {
                      await ensureNotificationPermission();
                      await clearLowStockNotifHash();
                      await notifyLowStockIfNeeded(
                        useProductsStore.getState().products,
                      );
                    }
                  }}
                />
              }
            />

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

            <SettingsRow
              icon="people-outline"
              title="Team & invites"
              subtitle="Invite teammates by email"
              onPress={() => router.push("/(app)/settings/team")}
            />
          </View>

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
                ...theme.shadows.sm,
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

            <SettingsRow
              icon="trash-bin-outline"
              title={"Reset Local Data"}
              onPress={handleReset}
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
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginBottom: 18,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 18,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 22,
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbLg: {
    width: 170,
    height: 170,
    top: -85,
    right: -45,
  },
  orbSm: {
    width: 100,
    height: 100,
    bottom: -50,
    left: -25,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  profileMeta: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600",
  },
  profileEmail: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    marginTop: 2,
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
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
  },
  row: {
    overflow: "hidden",
  },
  rowPressable: {
    flex: 1,
  },
  rowInner: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
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
    marginLeft: 60,
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
});
