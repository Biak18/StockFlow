import type { Product } from "@/features/products/types";

export interface ValuationRow {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  unit: string;
  cost_price: number;
  selling_price: number;
  cost_value: number;
  selling_value: number;
}

export function buildValuation(products: Product[]) {
  const rows: ValuationRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    quantity: p.quantity,
    unit: p.unit,
    cost_price: p.cost_price,
    selling_price: p.selling_price,
    cost_value: p.quantity * p.cost_price,
    selling_value: p.quantity * p.selling_price,
  }));

  const totals = rows.reduce(
    (acc, r) => {
      acc.cost += r.cost_value;
      acc.selling += r.selling_value;
      acc.units += r.quantity;
      return acc;
    },
    { cost: 0, selling: 0, units: 0 },
  );

  return { rows, totals };
}

export function productsToCsv(products: Product[]): string {
  const header = [
    "name",
    "sku",
    "barcode",
    "quantity",
    "unit",
    "cost_price",
    "selling_price",
    "cost_value",
    "selling_value",
    "min_stock_level",
  ];

  const escape = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    header.join(","),
    ...products.map((p) =>
      [
        p.name,
        p.sku,
        p.barcode,
        p.quantity,
        p.unit,
        p.cost_price,
        p.selling_price,
        p.quantity * p.cost_price,
        p.quantity * p.selling_price,
        p.min_stock_level,
      ]
        .map(escape)
        .join(","),
    ),
  ];

  return lines.join("\n");
}
