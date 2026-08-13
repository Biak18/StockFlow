import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Button, Skeleton } from "@/components/ui";
import { supplierRepository } from "@/features/suppliers/services/supplier-repository";
import { useFabKeyboardOffset } from "@/hooks/useFabKeyboardOffset";
import {
  alertDialog,
  confirmDialog,
  useAuthStore,
  useSuppliersStore,
  useUIStore,
} from "@/stores";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

export default function SuppliersScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const insets = useSafeAreaInsets();
  const keyboardOffset = useFabKeyboardOffset();
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardOffset.value }],
  }));
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

  if (loading && suppliers.length === 0) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Suppliers
          </Text>
        </View>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={64} borderRadius={14} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* <FadeIn> */}
      <View style={[styles.header]}>
        <View style={styles.headerLeft}>
          {/* <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={styles.backBtn}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={theme.colors.text}
              />
            </Pressable> */}

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Suppliers
          </Text>
        </View>
        {/* <Pressable
            onPress={() => router.push("/(app)/suppliers/create")}
            style={[
              styles.addBtn,
              {
                backgroundColor:
                  theme.colors.surfaceSecondary ?? theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons name="add" size={20} color={theme.colors.text} />
          </Pressable> */}
      </View>
      {/* </FadeIn> */}

      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor:
                theme.colors.surfaceSecondary ?? theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={16}
            color={theme.colors.textTertiary}
          />
          <RNTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search suppliers"
            placeholderTextColor={theme.colors.textTertiary}
            style={[styles.searchInput, { color: theme.colors.text }]}
            autoCorrect={false}
          />
        </View>
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
      ) : suppliers.length === 0 ? (
        <View style={styles.centered}>
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor:
                  theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
              },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={22}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No suppliers yet
          </Text>
          <Text
            style={[styles.emptySub, { color: theme.colors.textSecondary }]}
          >
            Group products by type to keep your catalog organized.
          </Text>
          <Button
            title="Add supplier"
            onPress={() => router.push("/(app)/suppliers/create")}
            style={{ marginTop: 16 }}
          />
        </View>
      ) : (
        <FlatList
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 75,
          }}
          ListHeaderComponent={
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: 12,
                marginBottom: 10,
              }}
            >
              {filtered.length} categor{filtered.length === 1 ? "y" : "ies"}
            </Text>
          }
          ListEmptyComponent={
            <Text
              style={{
                color: theme.colors.textSecondary,
                textAlign: "center",
                marginTop: 24,
              }}
            >
              No matches
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/suppliers/edit/${item.id}`)}
              onLongPress={() => handleDelete(item.id, item.name)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.rowIcon,
                  {
                    backgroundColor:
                      theme.colors.primaryMuted ??
                      theme.colors.surfaceSecondary,
                  },
                ]}
              >
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                {item.email ? (
                  <Text
                    style={[
                      styles.rowSub,
                      { color: theme.colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.email}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
        />
      )}

      {suppliers.length > 0 ? (
        <Animated.View
          style={[
            styles.fabPosition,
            { bottom: insets.bottom + 24 },
            fabAnimatedStyle,
          ]}
        >
          <Pressable
            onPress={() => router.push("/(app)/suppliers/create")}
            style={[
              styles.fab,
              {
                backgroundColor: theme.colors.primary,
                ...theme.shadows.md,
              },
            ]}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4 },
  fabPosition: {
    position: "absolute",
    right: 18,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchBox: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 10 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 2 },
});
