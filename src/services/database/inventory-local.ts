import { getDatabase } from "@/database";
import type { InventoryTxnType } from "@/features/inventory/types";

export interface LocalInventoryTxn {
  id: string;
  organization_id: string;
  product_id: string;
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

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const inventoryLocal = {
  async insert(
    txn: Omit<
      LocalInventoryTxn,
      "id" | "version" | "deleted_at" | "updated_at"
    > & {
      id?: string;
    },
  ): Promise<LocalInventoryTxn> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const row: LocalInventoryTxn = {
      id: txn.id ?? uuid(),
      organization_id: txn.organization_id,
      product_id: txn.product_id,
      type: txn.type,
      quantity_delta: txn.quantity_delta,
      reference_type: txn.reference_type ?? null,
      reference_id: txn.reference_id ?? null,
      notes: txn.notes ?? null,
      performed_by: txn.performed_by ?? null,
      created_at: txn.created_at ?? now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };

    await db.runAsync(
      `INSERT OR REPLACE INTO inventory_transactions (
        id, organization_id, product_id, type, quantity_delta,
        reference_type, reference_id, notes, performed_by,
        created_at, updated_at, deleted_at, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.organization_id,
        row.product_id,
        row.type,
        row.quantity_delta,
        row.reference_type,
        row.reference_id,
        row.notes,
        row.performed_by,
        row.created_at,
        row.updated_at,
        row.deleted_at,
        row.version,
      ],
    );

    return row;
  },

  async listForProduct(
    organizationId: string,
    productId: string,
    limit = 50,
  ): Promise<LocalInventoryTxn[]> {
    const db = await getDatabase();
    return db.getAllAsync<LocalInventoryTxn>(
      `SELECT * FROM inventory_transactions
       WHERE organization_id = ? AND product_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT ?`,
      [organizationId, productId, limit],
    );
  },

  async updateProductQuantity(
    productId: string,
    organizationId: string,
    newQuantity: number,
  ) {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE products
       SET quantity = ?, updated_at = ?
       WHERE id = ? AND organization_id = ?`,
      [newQuantity, now, productId, organizationId],
    );
  },
};
