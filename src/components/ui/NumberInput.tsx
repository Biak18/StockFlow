import {
  formatWithCommas,
  parseNumericString,
  sanitizeNumericInput,
} from "@/utils/number-format";
import { useMemo, useState } from "react";
import { TextInput, type AppTextInputProps } from "./TextInput";

type NumberInputProps = Omit<
  AppTextInputProps,
  "value" | "onChangeText" | "keyboardType"
> & {
  value: number | undefined | null;
  onChangeValue: (value: number | undefined) => void;
  /** prices → decimal; quantity → integer */
  mode?: "decimal" | "integer";
  maxDecimals?: number;
};

export function NumberInput({
  value,
  onChangeValue,
  mode = "decimal",
  maxDecimals = 2,
  onBlur,
  ...rest
}: NumberInputProps) {
  const allowDecimal = mode === "decimal";

  // Local string so typing "1." doesn't get wiped before the next digit
  const [text, setText] = useState(() =>
    value == null || value === 0 ? "" : String(value),
  );
  const [focused, setFocused] = useState(false);

  // Sync from RHF when not focused (e.g. reset / defaultValues)
  const display = useMemo(() => {
    if (focused) {
      return formatWithCommas(text);
    }
    if (value == null || Number.isNaN(value)) return "";
    // Avoid showing "0" as empty if you prefer 0 visible — change here
    if (value === 0 && text === "") return "";
    return formatWithCommas(String(value));
  }, [focused, text, value]);

  return (
    <TextInput
      {...rest}
      keyboardType={allowDecimal ? "decimal-pad" : "number-pad"}
      value={display}
      onFocus={(e) => {
        setFocused(true);
        // Start editing from raw digits
        // setText(value == null ? "" : String(value));
        rest.onFocus?.(e);
      }}
      onChangeText={(raw) => {
        const sanitized = sanitizeNumericInput(raw.replace(/,/g, ""), {
          allowDecimal,
          maxDecimals,
        });
        setText(sanitized);
        onChangeValue(parseNumericString(sanitized));
      }}
      onBlur={(e) => {
        setFocused(false);
        // Normalize once: "1." -> "1"
        const sanitized = sanitizeNumericInput(text.replace(/,/g, ""), {
          allowDecimal,
          maxDecimals,
        }).replace(/\.$/, "");
        setText(sanitized);
        onChangeValue(parseNumericString(sanitized));
        onBlur?.(e);
      }}
    />
  );
}
