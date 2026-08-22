import { useUIStore } from "@/stores";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

const FOCUS_MS = 180;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search",
}: SearchBarProps) {
  const theme = useUIStore((s) => s.theme);
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary],
    ),
    borderWidth: 1.5,
  }));

  const handleFocus = useCallback(
    (e: any) => {
      setFocused(true);
      focusProgress.value = withTiming(1, { duration: FOCUS_MS, easing: EASE });
    },
    [focusProgress],
  );

  const handleBlur = useCallback(
    (e: any) => {
      setFocused(false);
      focusProgress.value = withTiming(0, { duration: FOCUS_MS, easing: EASE });
    },
    [focusProgress],
  );

  const handleClear = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onChangeText("");
  }, [onChangeText]);

  return (
    <Animated.View
      style={[
        styles.box,
        borderStyle,
        {
          backgroundColor:
            theme.colors.surfaceSecondary ?? theme.colors.surface,
        },
      ]}
    >
      <Ionicons
        name="search-outline"
        size={17}
        color={focused ? theme.colors.primary : theme.colors.textTertiary}
      />
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        style={[styles.input, { color: theme.colors.text }]}
        autoCorrect={false}
        autoCapitalize="none"
        onFocus={handleFocus}
        onBlur={handleBlur}
        accessibilityRole="search"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={handleClear}
          hitSlop={10}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Ionicons
            name="close-circle"
            size={17}
            color={theme.colors.textTertiary}
          />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 46,
    borderRadius: 15,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 11,
    fontWeight: "500",
  },
});
