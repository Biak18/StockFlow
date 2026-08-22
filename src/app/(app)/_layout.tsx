import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useUIStore } from "@/stores";
import { Tabs, usePathname } from "expo-router";
import { useEffect } from "react";
import {
  ColorValue,
  Platform,
  StyleSheet,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const POP_SPRING = { damping: 14, stiffness: 380, mass: 0.6 };

type IoniconName = any;

const TAB_ICONS: Record<string, { active: IoniconName; idle: IoniconName }> = {
  index: { active: "grid", idle: "grid-outline" },
  products: { active: "cube", idle: "cube-outline" },
  categories: { active: "shapes", idle: "shapes-outline" },
  suppliers: { active: "person", idle: "person-outline" },
  settings: { active: "settings", idle: "settings-outline" },
};

const TAB_ORDER = ["index", "products", "categories", "suppliers", "settings"];

function useActiveTabIndex() {
  const pathname = usePathname();
  const firstSegment =
    !pathname || pathname === "/"
      ? "index"
      : (pathname.replace(/^\//, "").split("/")[0] || "index");
  const idx = TAB_ORDER.indexOf(firstSegment);
  return idx === -1 ? 0 : idx;
}

function PopIcon({
  name,
  focused,
  color,
}: {
  name: IoniconName;
  focused: boolean;
  color: ColorValue;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withTiming(1.18, { duration: 130, easing: Easing.out(Easing.quad) }),
        withSpring(1, POP_SPRING),
      );
    }
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}

function SlidingIndicator({ index, tabCount }: { index: number; tabCount: number }) {
  const theme = useUIStore((s) => s.theme);
  const progress = useSharedValue(index);

  useEffect(() => {
    progress.value = withSpring(index, {
      damping: 20,
      stiffness: 300,
      mass: 0.7,
    });
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${progress.value * 100}%` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.indicator,
        animatedStyle,
        {
          backgroundColor:
            theme.colors.primaryMuted ?? theme.colors.surfaceSecondary,
        },
      ]}
    />
  );
}

function TabBackground({ tabCount }: { tabCount: number }) {
  const theme = useUIStore((s) => s.theme);
  const index = useActiveTabIndex();

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        theme.mode === "dark" ? styles.bgDark : null,
      ]}
    >
      <SlidingIndicator index={index} tabCount={tabCount} />
    </Animated.View>
  );
}

export default function AppLayout() {
  const theme = useUIStore((s) => s.theme);

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
            () => {},
          );
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor:
              theme.mode === "dark"
                ? "rgba(30, 41, 59, 0.97)"
                : theme.colors.surface,
            borderColor: theme.colors.border,
            marginBottom: Platform.OS === "ios" ? 10 : 8,
            marginHorizontal: 14,
            ...theme.shadows.lg,
          },
        ],
        tabBarBackground: () => <TabBackground tabCount={5} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <PopIcon
              name={focused ? TAB_ICONS.index.active : TAB_ICONS.index.idle}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, focused }) => (
            <PopIcon
              name={
                focused ? TAB_ICONS.products.active : TAB_ICONS.products.idle
              }
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, focused }) => (
            <PopIcon
              name={
                focused
                  ? TAB_ICONS.categories.active
                  : TAB_ICONS.categories.idle
              }
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          title: "Suppliers",
          tabBarIcon: ({ color, focused }) => (
            <PopIcon
              name={
                focused ? TAB_ICONS.suppliers.active : TAB_ICONS.suppliers.idle
              }
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <PopIcon
              name={
                focused ? TAB_ICONS.settings.active : TAB_ICONS.settings.idle
              }
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderRadius: 24,
    height: 64,
    overflow: "hidden",
  },
  bgDark: {
    backgroundColor: "rgba(30, 41, 59, 0.97)",
  },
  indicator: {
    position: "absolute",
    top: 6,
    bottom: 6,
    width: "20%",
    borderRadius: 18,
  },
});
