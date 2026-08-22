import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  Button,
  EmptyState,
  FAB,
  ScreenHeader,
  SearchBar,
} from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { supplierRepository } from "@/features/suppliers/services/supplier-repository";
import {
  alertDialog,
  confirmDialog,
  useAuthStore,
  useSuppliersStore,
  useUIStore,
} from "@/stores";

const ACCENTS = [
  "#6366F1",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

function accentFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return ACCENTS[h % ACCENTS.length];
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SuppliersScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const insets = useSafeAreaInsets();
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const loading = useSuppliersStore((s) => s.loading);
  const error = useSuppliersStore((s) => s.error);
  const fetchSuppliers = useSuppliersStore((s) => s.fetchSuppliers);
  const removeSupplier = useSuppliersStore((s) => s.removeSupplier);

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (organization?.id) fetchSuppliers(organization.id);
  }, [organization?.id, fetchSuppliers]);

  const onRefresh = () => {
    if (organization?.id) fetchSuppliers(organization.id, { force: true });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    );
  }, [suppliers, query]);

  const handleDelete = async (id: string, name: string) => {
    if (!organization?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const ok = await confirmDialog({
      title: "Delete supplier?",
      message: `Remove “${name}” from your catalog?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });
    if (!ok) return;
    try {
      await supplierRepository.remove(id, organization.id);
      removeSupplier(id);
    } catch (err) {
      await alertDialog({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to delete",
        confirmLabel: "OK",
      });
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScreenHeader
        title="Suppliers"
        subtitle={
          suppliers.length > 0
            ? `${suppliers.length} in your network`
            : undefined
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search suppliers"
        />
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.danger, marginBottom: 12 }}>
            {error}
          </Text>
          <Button
            title="Try again"
            onPress={() =>
              organization?.id &&
              fetchSuppliers(organization.id, { force: true })
            }
          />
        </View>
      ) : suppliers.length === 0 && !loading ? (
        <EmptyState
          icon="storefront-outline"
          title="No suppliers yet"
          message="Track who you buy from — add contact details so reordering is one tap away."
          action={
            <Button
              title="Add supplier"
              onPress={() => router.push("/(app)/suppliers/create")}
            />
          }
        />
      ) : (
        <FlatList
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 110,
          }}
          ListEmptyComponent={
            <View style={{ marginTop: 24 }}>
              <EmptyState
                icon="search-outline"
                title="No matches"
                message="Try a different search term."
              />
            </View>
          }
          renderItem={({ item, index }) => {
            const accent = accentFor(item.name);
            return (
              <Animated.View
                entering={
                  index < 8
                    ? FadeInDown.duration(280)
                        .delay(index * 45)
                        .withInitialValues({
                          opacity: 0,
                          transform: [{ translateY: 14 }],
                        })
                    : undefined
                }
              >
                <PressableScale
                  onPress={() =>
                    router.push(`/(app)/suppliers/edit/${item.id}`)
                  }
                  onLongPress={() => handleDelete(item.id, item.name)}
                  scaleTo={0.98}
                  haptic="light"
                  style={[
                    styles.row,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      ...theme.shadows.sm,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: `${accent}1A` },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: accent }]}>
                      {getInitials(item.name)}
                    </Text>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text
                      style={[styles.rowTitle, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {item.email || item.phone ? (
                      <Text
                        style={[
                          styles.rowSub,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.email ?? item.phone}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                </PressableScale>
              </Animated.View>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
        />
      )}

      <FAB onPress={() => router.push("/(app)/suppliers/create")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 14 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    marginBottom: 9,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  rowSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
});
