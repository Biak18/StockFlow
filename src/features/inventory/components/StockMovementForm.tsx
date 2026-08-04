import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FadeIn, Stagger } from "@/components/motion";
import { Button, ErrorMessage, NumberInput, TextInput } from "@/components/ui";
import { useUIStore } from "@/stores";
import {
  stockMovementSchema,
  type StockMovementFormValues,
} from "../schemas/inventory-schemas";
import type { InventoryTxnType } from "../types";

interface StockMovementFormProps {
  type: InventoryTxnType;
  currentQuantity: number;
  unit: string;
  onSubmit: (values: StockMovementFormValues) => Promise<void>;
}

const TYPE_LABELS: Record<InventoryTxnType, string> = {
  in: "Stock In",
  out: "Stock Out",
  adjustment: "Adjustment",
};

export function StockMovementForm({
  type,
  currentQuantity,
  unit,
  onSubmit,
}: StockMovementFormProps) {
  const theme = useUIStore((s) => s.theme);
  const insets = useSafeAreaInsets();

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      type,
      quantity: type === "adjustment" ? currentQuantity : undefined,
      notes: "",
    },
  });

  const handleFormSubmit = async (values: StockMovementFormValues) => {
    try {
      setLoading(true);
      setFormError(null);
      await onSubmit({ ...values, type });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const quantityLabel =
    type === "adjustment"
      ? `New quantity (${unit})`
      : `Quantity to ${type === "in" ? "add" : "remove"} (${unit})`;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <FadeIn delay={80} duration={300}>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.infoLabel, { color: theme.colors.textSecondary }]}
            >
              Current stock
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {currentQuantity} {unit}
            </Text>
          </View>
        </FadeIn>

        <ErrorMessage message={formError} />

        <Stagger baseDelay={80} step={40}>
          <Controller
            control={control}
            name="quantity"
            render={({ field: { onChange, onBlur, value } }) => (
              <NumberInput
                label={quantityLabel}
                // placeholder="0"
                mode="decimal"
                maxDecimals={0}
                onBlur={onBlur}
                onChangeValue={onChange}
                value={value}
                error={errors.quantity?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Notes"
                placeholder="Optional reason or reference"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.notes?.message}
              />
            )}
          />

          <Button
            title={TYPE_LABELS[type]}
            onPress={handleSubmit(handleFormSubmit)}
            loading={loading}
            fullWidth
            style={{ marginTop: 8 }}
          />
        </Stagger>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  infoCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 22,
    fontWeight: "700",
  },
});
