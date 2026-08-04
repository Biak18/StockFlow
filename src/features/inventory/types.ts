import type { UUID } from "@/types";

export type InventoryTxnType = "in" | "out" | "adjustment";

export interface InventoryTransaction {
  id: UUID;
  organization_id: UUID;
  product_id: UUID;
  type: InventoryTxnType;
  quantity_delta: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
}
