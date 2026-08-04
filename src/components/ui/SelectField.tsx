import { useUIStore } from "@/stores";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type SelectOption = {
  label: string;
  value: string;
};

interface SelectFieldProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  error?: string;
  allowClear?: boolean;
}

export function SelectField({
  label,
  placeholder = "Select...",
  options,
  value,
  onChange,
  error,
  allowClear = true,
}: SelectFieldProps) {
  const theme = useUIStore((s) => s.theme);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Text
          style={{
            color: selected ? theme.colors.text : theme.colors.textTertiary,
            fontSize: 16,
          }}
        >
          {selected ? selected.label : placeholder}
        </Text>
      </Pressable>

      {error ? (
        <Text style={[styles.error, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : null}

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <SafeAreaView
            style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                {label}
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text
                  style={{ color: theme.colors.primary, fontWeight: "600" }}
                >
                  Done
                </Text>
              </Pressable>
            </View>

            {allowClear ? (
              <Pressable
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
                style={styles.option}
              >
                <Text style={{ color: theme.colors.textTertiary }}>None</Text>
              </Pressable>
            ) : null}

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      isSelected && {
                        backgroundColor: theme.colors.primaryMuted,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.colors.text,
                        fontWeight: isSelected ? "600" : "400",
                        fontSize: 16,
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  field: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: {
    fontSize: 13,
    marginTop: 6,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    maxHeight: "60%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
