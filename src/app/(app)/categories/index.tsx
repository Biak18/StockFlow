import { Button, Skeleton } from "@/components/ui";
import { categoryService } from "@/features/categories/services/category-service";
import {
  alertDialog,
  confirmDialog,
  useAuthStore,
  useCategoriesStore,
  useUIStore,
} from "@/stores";
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
      await categoryService.softDelete(id, organization.id);
      removeCategory(id);
    } catch (err) {
      await alertDialog({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to delete",
        confirmLabel: "OK",
      });
    }
  };

  if (loading && categories.length === 0) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Categories
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
            Categories
          </Text>
        </View>
        {/* <Pressable
            onPress={() => router.push("/(app)/categories/create")}
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
            placeholder="Search categories"
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
              fetchCategories(organization.id, { force: true })
            }
          />
        </View>
      ) : categories.length === 0 ? (
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
              name="grid-outline"
              size={22}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No categories yet
          </Text>
          <Text
            style={[styles.emptySub, { color: theme.colors.textSecondary }]}
          >
            Group products by type to keep your catalog organized.
          </Text>
          <Button
            title="Add category"
            onPress={() => router.push("/(app)/categories/create")}
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
              onPress={() => router.push(`/(app)/categories/edit/${item.id}`)}
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
                  name="pricetag-outline"
                  size={16}
                  color={theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
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
            </Pressable>
          )}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
        />
      )}

      {categories.length > 0 ? (
        <Pressable
          onPress={() => router.push("/(app)/categories/create")}
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
              bottom: insets.bottom + 24,
              ...theme.shadows.md,
            },
          ]}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
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
  fab: {
    position: "absolute",
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
