import type { Product } from "@/features/products/types";
import { inventoryLocal } from "@/services/database/inventory-local";
import { productLocal } from "@/services/database/product-local";
import { getNetworkOnline } from "@/services/network";
import { syncQueue } from "@/services/sync/sync-queue";
import type { InventoryTxnType } from "../types";
import { inventoryService } from "./inventory-service";

export const inventoryRepository = {
  async applyMovement(params: {
    organizationId: string;
    productId: string;
    type: InventoryTxnType;
    quantity: number;
    notes?: string | null;
    performedBy?: string | null;
    currentQuantity: number;
  }): Promise<Product> {
    const {
      organizationId,
      productId,
      type,
      quantity,
      notes,
      performedBy,
      currentQuantity,
    } = params;

    let delta = 0;
    if (type === "in") delta = quantity;
    else if (type === "out") delta = -quantity;
    else delta = quantity - currentQuantity; // adjustment = absolute

    const newQuantity = currentQuantity + delta;
    if (newQuantity < 0) {
      throw new Error("Insufficient stock for this movement");
    }

    // Online path
    if (getNetworkOnline()) {
      try {
        const product = await inventoryService.applyMovement(params);
        await productLocal.upsertOne(product);
        // Best-effort local txn mirror (optional)
        await inventoryLocal.insert({
          organization_id: organizationId,
          product_id: productId,
          type,
          quantity_delta: delta,
          reference_type: "manual",
          reference_id: null,
          notes: notes ?? null,
          performed_by: performedBy ?? null,
          created_at: new Date().toISOString(),
        });
        return product;
      } catch (err) {
        // If remote fails, fall through to offline path only if clearly network-related
        console.warn("Remote movement failed, attempting local queue", err);
      }
    }

    // Offline path
    const now = new Date().toISOString();

    const txn = await inventoryLocal.insert({
      organization_id: organizationId,
      product_id: productId,
      type,
      quantity_delta: delta,
      reference_type: "manual",
      reference_id: null,
      notes: notes ?? null,
      performed_by: performedBy ?? null,
      created_at: now,
    });

    await inventoryLocal.updateProductQuantity(
      productId,
      organizationId,
      newQuantity,
    );

    const existing = await productLocal.getById(productId, organizationId);
    if (!existing) {
      throw new Error("Product not found locally");
    }

    const updated: Product = {
      ...existing,
      quantity: newQuantity,
      updated_at: now,
      version: existing.version + 1,
    };
    await productLocal.upsertOne(updated);

    await syncQueue.enqueue({
      tableName: "inventory_transactions",
      recordId: txn.id,
      operation: "insert",
      payload: {
        transaction: txn,
        product_id: productId,
        organization_id: organizationId,
        new_quantity: newQuantity,
      },
    });

    return updated;
  },

  async listForProduct(organizationId: string, productId: string) {
    if (getNetworkOnline()) {
      try {
        return await inventoryService.listForProduct(organizationId, productId);
      } catch {
        // fall back
      }
    }

    const rows = await inventoryLocal.listForProduct(organizationId, productId);
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      quantity_delta: r.quantity_delta,
      notes: r.notes,
      created_at: r.created_at,
    }));
  },
};
