import type { UUID } from "@/types";

export interface Product {
  id: UUID;
  organization_id: UUID;
  name: string;
  sku: string | null;
  barcode: string | null;
  category_id: UUID | null;
  supplier_id: UUID | null;
  cost_price: number;
  selling_price: number;
  quantity: number;
  unit: string;
  image_path: string | null;
  description: string | null;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
}

export type ProductInsert = Omit<
  Product,
  "id" | "created_at" | "updated_at" | "deleted_at" | "version" | "quantity"
> & {
  quantity?: number;
};

export type ProductUpdate = Partial<
  Omit<Product, "id" | "organization_id" | "created_at" | "updated_at">
>;
