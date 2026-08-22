import { Ionicons } from "@expo/vector-icons";
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
import { categoryRepository } from "@/features/categories/services/category-repository";
import {
  alertDialog,
  confirmDialog,
  useAuthStore,
  useCategoriesStore,
  useUIStore,
} from "@/stores";
import * as Haptics from "expo-haptics";
import { PressableScale } from "@/components/ui/PressableScale";

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

export default function CategoriesScreen() {
  const theme = useUIStore((s) => s.theme);
  const organization = useAuthStore((s) => s.currentOrganization);
  const insets = useSafeAreaInsets();
  const categories = useCategoriesStore((s) => s.categories);
  const loading = useCategoriesStore((s) => s.loading);
  const error = useCategoriesStore((s) => s.error);
  const fetchCategories = useCategoriesStore((s) => s.fetchCategories);
  const removeCategory = useCategoriesStore((s) => s.removeCategory);

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (organization?.id) fetchCategories(organization.id);
  }, [organization?.id, fetchCategories]);

  const onRefresh = () => {
    if (organization?.id) fetchCategories(organization.id, { force: true });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q),
    );
  }, [categories, query]);

  const handleDelete = async (id: string, name: string) => {
    if (!organization?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const ok = await confirmDialog({
      title: "Delete category?",
      message: `Remove “${name}” from your catalog?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      destructive: true,
    });

    if (!ok) return;
    try {
      await categoryRepository.remove(id, organization.id);
      removeCategory(id);
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
        title="Categories"
        subtitle={
          categories.length > 0
            ? `${categories.length} in your catalog`
            : undefined
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search categories"
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
              fetchCategories(organization.id, { force: true })
            }
          />
        </View>
      ) : categories.length === 0 && !loading ? (
        <EmptyState
          icon="shapes-outline"
          title="No categories yet"
          message="Group products by type to keep your catalog organized and easy to browse."
          action={
            <Button
              title="Add category"
              onPress={() => router.push("/(app)/categories/create")}
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
                    router.push(`/(app)/categories/edit/${item.id}`)
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
                      styles.rowIcon,
                      { backgroundColor: `${accent}1A` },
                    ]}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={17}
                      color={accent}
                    />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text
                      style={[styles.rowTitle, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {item.description ? (
                      <Text
                        style={[
                          styles.rowSub,
                          { color: theme.colors.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.description}
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

      <FAB onPress={() => router.push("/(app)/categories/create")} />
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
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
  rowSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
});
