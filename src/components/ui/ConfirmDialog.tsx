import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "@/stores";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "confirm" | "alert";
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
  variant = "confirm",
}: ConfirmDialogProps) {
  const theme = useUIStore((s) => s.theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              ...theme.shadows.md,
            },
          ]}
        >
          {destructive || variant === "alert" ? (
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor:
                    theme.colors.dangerMuted ??
                    theme.colors.surfaceSecondary,
                },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={20}
                color={theme.colors.danger}
              />
            </View>
          ) : null}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>

          {variant === "alert" ? (
            <View style={styles.actions}>
              <View style={styles.actionBtn}>
                <Button
                  title={confirmLabel || "OK"}
                  onPress={onConfirm}
                  loading={loading}
                  fullWidth
                />
              </View>
            </View>
          ) : (
            <View style={styles.actions}>
              <View style={styles.actionBtn}>
                <Button
                  title={cancelLabel || "Cancel"}
                  variant="secondary"
                  onPress={onCancel}
                  disabled={loading}
                  fullWidth
                />
              </View>
              <View style={styles.actionBtn}>
                <Button
                  title={confirmLabel || "Confirm"}
                  onPress={onConfirm}
                  loading={loading}
                  fullWidth
                  style={
                    destructive
                      ? { backgroundColor: theme.colors.danger }
                      : undefined
                  }
                />
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
});
