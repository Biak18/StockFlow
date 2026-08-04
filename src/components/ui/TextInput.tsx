import { useUIStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Pressable,
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedView = Animated.createAnimatedComponent(View);

type IconRender = (props: { color: string; size: number }) => React.ReactNode;

export interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: IconRender;
  rightIcon?: IconRender;
  onRightIconPress?: () => void;
  /** Enables show/hide toggle (overrides rightIcon when set) */
  isPassword?: boolean;
}

const FOCUS_MS = 180;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export function TextInput({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword,
  style,
  onFocus,
  onBlur,
  secureTextEntry,
  ...rest
}: AppTextInputProps) {
  const theme = useUIStore((s) => s.theme);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const focusProgress = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [
        error ? theme.colors.danger : theme.colors.border,
        error ? theme.colors.danger : theme.colors.primary,
      ],
    );
    return {
      borderColor,
      borderWidth: 1.5,
    };
  }, [error, theme.colors.border, theme.colors.primary, theme.colors.danger]);

  const handleFocus = useCallback(
    (e: any) => {
      setFocused(true);
      focusProgress.value = withTiming(1, { duration: FOCUS_MS, easing: EASE });
      onFocus?.(e);
    },
    [onFocus, focusProgress],
  );

  const handleBlur = useCallback(
    (e: any) => {
      setFocused(false);
      focusProgress.value = withTiming(0, { duration: FOCUS_MS, easing: EASE });
      onBlur?.(e);
    },
    [onBlur, focusProgress],
  );

  const iconColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.textTertiary;

  const showPasswordToggle = !!isPassword;
  const secure = isPassword ? hidden : secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      ) : null}

      <AnimatedView
        style={[
          styles.field,
          {
            backgroundColor:
              theme.colors.surfaceSecondary ?? theme.colors.surface,
            borderRadius: theme.radius.md,
          },
          borderStyle,
        ]}
      >
        {leftIcon ? (
          <View style={styles.iconLeft}>
            {leftIcon({ color: iconColor, size: 18 })}
          </View>
        ) : null}

        <RNTextInput
          placeholderTextColor={theme.colors.textTertiary}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              paddingLeft: leftIcon ? 0 : 14,
              paddingRight: rightIcon || showPasswordToggle ? 0 : 14,
            },
            style,
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secure}
          {...rest}
        />

        {showPasswordToggle ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={10}
            style={styles.iconRight}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            {/* Replace with your icon set if you have one */}

            {hidden ? (
              <Ionicons name="eye-outline" size={18} color={iconColor} />
            ) : (
              <Ionicons name="eye-off-outline" size={18} color={iconColor} />
            )}
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            hitSlop={10}
            style={styles.iconRight}
            disabled={!onRightIconPress}
          >
            {rightIcon({ color: iconColor, size: 18 })}
          </Pressable>
        ) : null}
      </AnimatedView>

      {error ? (
        <Text style={[styles.error, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  field: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    fontSize: 16,
  },
  iconLeft: {
    paddingLeft: 14,
    paddingRight: 10,
    justifyContent: "center",
  },
  iconRight: {
    paddingRight: 14,
    paddingLeft: 10,
    justifyContent: "center",
    minWidth: 44,
    alignItems: "flex-end",
  },
  error: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
});
