import { useUIStore } from "@/stores";
import { typography } from "@/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

interface DropdownItem {
  id: string;
  label: string;
  subLabel?: string;
}

interface PickerDropdownProps {
  title?: string;
  placeholder?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  optionalText?: string;
  optionalTextColor?: string;
  data: DropdownItem[];
  value: string | null; // This maps to item.id
  onChange: (item: DropdownItem | null) => void;
  nullable?: boolean;
  readonly?: boolean;
  error?: string;
}

export const PickerDropdown = ({
  title,
  optionalText,
  optionalTextColor,
  icon,
  placeholder,
  data,
  value,
  onChange,
  nullable = true,
  readonly = false,
  error,
}: PickerDropdownProps) => {
  const theme = useUIStore((s) => s.theme);
  const [isFocus, setIsFocus] = useState(false);
  const isActive = value != null && value !== "";

  const renderCustomLeftIcon = () => {
    if (!icon) return null;
    const color = readonly
      ? theme.colors.textTertiary
      : error
        ? theme.colors.danger
        : isActive || isFocus
          ? theme.colors.primary
          : theme.colors.textTertiary;
    return (
      <Ionicons name={icon} size={20} color={color} style={styles.leftIcon} />
    );
  };

  const renderCustomRightIcon = () => {
    if (readonly) {
      return (
        <Ionicons
          name="chevron-down-outline"
          size={16}
          color={theme.colors.textTertiary}
        />
      );
    }
    if (isActive) {
      return (
        <Pressable
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation();
            onChange(null);
          }}
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={theme.colors.textTertiary}
          />
        </Pressable>
      );
    }
    return (
      <Ionicons
        name="chevron-down-outline"
        size={16}
        color={theme.colors.textTertiary}
      />
    );
  };

  const renderItemRow = (item: DropdownItem, selected?: boolean) => {
    const isSelected = selected ?? value === item.id;

    return (
      <View
        style={[
          styles.itemRow,
          {
            backgroundColor: isSelected
              ? (theme.colors.primaryMuted ?? theme.colors.surfaceSecondary)
              : theme.colors.surface,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.itemLabel,
              {
                color: isSelected ? theme.colors.primary : theme.colors.text,
              },
            ]}
          >
            {item.label}
          </Text>
          {item.subLabel ? (
            <Text
              style={[
                styles.itemSubText,
                { color: theme.colors.textSecondary },
              ]}
            >
              {item.subLabel}
            </Text>
          ) : null}
        </View>
        {isSelected ? (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={theme.colors.primary}
          />
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      {title ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {title}{" "}
          {optionalText ? (
            <Text
              style={[
                styles.optional,
                { color: optionalTextColor ?? theme.colors.textTertiary },
              ]}
            >
              {optionalText}
            </Text>
          ) : null}
          {!nullable ? (
            <Text style={{ color: theme.colors.danger }}> *</Text>
          ) : null}
        </Text>
      ) : null}

      <Dropdown
        placeholder={placeholder || "Select item..."}
        style={[
          styles.dropdownEngine,
          {
            borderColor: error
              ? theme.colors.danger
              : isFocus
                ? theme.colors.primary
                : theme.colors.border,
            backgroundColor: readonly
              ? theme.colors.surfaceSecondary
              : theme.colors.surface,
          },
        ]}
        placeholderStyle={[
          styles.valueTextPlaceholder,
          { color: theme.colors.textTertiary },
        ]}
        selectedTextStyle={[
          styles.valueTextFilled,
          { color: theme.colors.text },
        ]}
        inputSearchStyle={[
          styles.inputSearchStyle,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceSecondary,
            borderColor: theme.colors.border,
          },
        ]}
        activeColor={theme.colors.primaryMuted ?? theme.colors.surfaceSecondary}
        itemContainerStyle={{
          backgroundColor: theme.colors.surface,
        }}
        containerStyle={[
          styles.dropdownContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: StyleSheet.hairlineWidth,
            overflow: "hidden",
          },
        ]}
        data={data}
        search
        disable={readonly}
        maxHeight={320}
        labelField="label"
        valueField="id"
        value={value}
        searchPlaceholder="Search..."
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={(item) => {
          onChange(item);
          setIsFocus(false);
        }}
        renderLeftIcon={renderCustomLeftIcon}
        renderRightIcon={renderCustomRightIcon}
        selectedTextProps={{
          numberOfLines: 1,
        }}
        renderItem={renderItemRow}
        flatListProps={{
          keyboardShouldPersistTaps: "handled",
          bounces: false,
        }}
        showsVerticalScrollIndicator={false}
      />

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle-outline"
            size={12}
            color={theme.colors.danger}
          />
          <Text style={[styles.errorText, { color: theme.colors.danger }]}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    marginBottom: 6,
  },
  optional: {
    fontFamily: typography.fonts.regular,
    opacity: 0.3,
  },
  required: {
    color: "#f87171",
  },
  dropdownEngine: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  dropdownEngineReadonly: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  leftIcon: {
    marginRight: 12,
  },
  valueTextFilled: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.medium,
  },
  valueTextPlaceholder: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.medium,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 11,
    fontFamily: typography.fonts.regular,
  },
  // Floating overlay popup styles
  dropdownContainer: {
    borderRadius: 16,
    marginTop: 4,
    paddingHorizontal: 6,
    boxShadow: "0px 3px 12px rgba(0, 0, 0, 0.08)",
  },
  inputSearchStyle: {
    height: 44,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    borderRadius: 12,
    borderColor: "#F3F4F6",
    backgroundColor: "#F8FAFC",
  },
  // Row structure elements within overlay lists
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  itemRowActive: {},
  itemLabel: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.medium,
  },
  itemLabelActive: {},
  itemSubText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: "#94A3B8",
    marginTop: 2,
  },
});
