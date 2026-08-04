import { productLocal } from "@/services/database/product-local";
import { getNetworkOnline } from "@/services/network";
import { syncQueue } from "@/services/sync/sync-queue";
import type { Product, ProductInsert, ProductUpdate } from "../types";
import { productService } from "./product-service";

function isOnline() {
  return getNetworkOnline();
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const productRepository = {
  /**
   * List products: prefer remote when online, always refresh local cache.
   * When offline, read from SQLite only.
   */
  async list(organizationId: string): Promise<Product[]> {
    if (isOnline()) {
      try {
        const remote = await productService.list(organizationId);
        await productLocal.upsertMany(remote);
        return remote;
      } catch (err) {
        // Network blip → fall back to local
        console.warn("Remote product list failed, using local cache", err);
        return productLocal.list(organizationId);
      }
    }

    return productLocal.list(organizationId);
  },

  async getById(id: string, organizationId: string): Promise<Product | null> {
    if (isOnline()) {
      try {
        const remote = await productService.getById(id, organizationId);
        if (remote) await productLocal.upsertOne(remote);
        return remote;
      } catch {
        return productLocal.getById(id, organizationId);
      }
    }

    return productLocal.getById(id, organizationId);
  },

  /**
   * Create product.
   * Online → Supabase then cache.
   * Offline → local row + sync queue.
   */
  async create(payload: ProductInsert): Promise<Product> {
    if (isOnline()) {
      const product = await productService.create(payload);
      await productLocal.upsertOne(product);
      return product;
    }

    const now = new Date().toISOString();
    const localProduct: Product = {
      id: uuid(),
      organization_id: payload.organization_id,
      name: payload.name,
      sku: payload.sku ?? null,
      barcode: payload.barcode ?? null,
      category_id: payload.category_id ?? null,
      supplier_id: payload.supplier_id ?? null,
      cost_price: payload.cost_price,
      selling_price: payload.selling_price,
      quantity: payload.quantity ?? 0,
      unit: payload.unit || "pcs",
      image_path: payload.image_path ?? null,
      description: payload.description ?? null,
      min_stock_level: payload.min_stock_level ?? 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    };

    await productLocal.upsertOne(localProduct);
    await syncQueue.enqueue({
      tableName: "products",
      recordId: localProduct.id,
      operation: "insert",
      payload: localProduct as unknown as Record<string, unknown>,
    });

    return localProduct;
  },

  async update(
    id: string,
    organizationId: string,
    payload: ProductUpdate,
  ): Promise<Product> {
    if (isOnline()) {
      const product = await productService.update(id, organizationId, payload);
      await productLocal.upsertOne(product);
      return product;
    }

    const existing = await productLocal.getById(id, organizationId);
    if (!existing) {
      throw new Error("Product not found locally");
    }

    const updated: Product = {
      ...existing,
      ...payload,
      id: existing.id,
      organization_id: existing.organization_id,
      updated_at: new Date().toISOString(),
      version: existing.version + 1,
    };

    await productLocal.upsertOne(updated);
    await syncQueue.enqueue({
      tableName: "products",
      recordId: id,
      operation: "update",
      payload: updated as unknown as Record<string, unknown>,
    });

    return updated;
  },

  async softDelete(id: string, organizationId: string): Promise<void> {
    if (isOnline()) {
      await productService.softDelete(id, organizationId);
      await productLocal.softDelete(id, organizationId);
      return;
    }

    await productLocal.softDelete(id, organizationId);
    await syncQueue.enqueue({
      tableName: "products",
      recordId: id,
      operation: "delete",
      payload: { id, organization_id: organizationId },
    });
  },
};
