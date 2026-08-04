/** Strip to a clean numeric string (optional decimals). */
export function sanitizeNumericInput(
  raw: string,
  options: { allowDecimal?: boolean; maxDecimals?: number } = {},
): string {
  const { allowDecimal = true, maxDecimals = 2 } = options;

  // Keep digits and at most one dot
  let next = raw.replace(/[^\d.]/g, "");

  if (!allowDecimal) {
    next = next.replace(/\./g, "");
  } else {
    const parts = next.split(".");
    if (parts.length > 2) {
      next = parts[0] + "." + parts.slice(1).join("");
    }
    const [intPart, decPart] = next.split(".");
    if (decPart != null) {
      next = intPart + "." + decPart.slice(0, maxDecimals);
    }
  }

  // Kill leading zeros: "021" -> "21", "000" -> "0", "0.5" stays
  if (next.includes(".")) {
    const [i, d] = next.split(".");
    const normalizedInt = i.replace(/^0+(?=\d)/, "") || "0";
    next = normalizedInt + "." + d;
  } else if (next.length > 1) {
    next = next.replace(/^0+/, "") || "0";
  }

  return next;
}

/** "1000.5" -> "1,000.5" */
export function formatWithCommas(numericString: string): string {
  if (!numericString) return "";

  const negative = numericString.startsWith("-");
  const raw = negative ? numericString.slice(1) : numericString;
  const [intPart, decPart] = raw.split(".");

  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body =
    decPart != null && decPart.length > 0
      ? `${withCommas}.${decPart}`
      : raw.endsWith(".")
        ? `${withCommas}.`
        : withCommas;

  return negative ? `-${body}` : body;
}

export function parseNumericString(numericString: string): number | undefined {
  if (!numericString || numericString === "." || numericString === "-") {
    return undefined;
  }
  const n = Number(numericString);
  return Number.isFinite(n) ? n : undefined;
}

export function formatMoney(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
