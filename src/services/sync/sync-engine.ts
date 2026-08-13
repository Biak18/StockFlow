import { imageService, productRepository } from "@/features/products";
import { findProductByBarcode } from "@/features/products/hooks/useProductByBarcode";
import { deleteLocalProductImage } from "@/features/products/services/local-image";
import { productLocal } from "@/services/database/product-local";
import { getNetworkOnline } from "@/services/network";
import { supabase } from "@/services/supabase";
import { useProductsStore } from "@/stores";
import { useUIStore } from "@/stores/ui-store";
import { syncQueue, type SyncQueueItem } from "./sync-queue";

async function processItem(item: SyncQueueItem) {
  await syncQueue.markSyncing(item.id);
  const payload = JSON.parse(item.payload);

  try {
    if (item.table_name === "products") {
      if (item.operation === "insert") {
        // Insert with client-generated id so local/remote stay aligned
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        if (data) await productLocal.upsertOne(data);
      }

      if (item.operation === "update") {
        const { id, organization_id, ...rest } = payload;
        const { data, error } = await supabase
          .from("products")
          .update(rest)
          .eq("id", id)
          .eq("organization_id", organization_id)
          .select()
          .single();

        if (error) throw error;
        if (data) await productLocal.upsertOne(data);
      }

      if (item.operation === "delete") {
        const { id, organization_id } = payload;
        const { error } = await supabase
          .from("products")
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("organization_id", organization_id);

        if (error) throw error;
      }
    }

    if (item.table_name === "product_images") {
      const path = await imageService.uploadFromLocalFile({
        organizationId: payload.organization_id as string,
        productId: payload.product_id as string,
        localUri: payload.local_uri as string,
        mimeType: (payload.mime_type as string) ?? "image/jpeg",
        fileName: (payload.file_name as string) ??
          `product-${item.record_id}.jpg`,
      });

      await productRepository.update(
        payload.product_id as string,
        payload.organization_id as string,
        { image_path: path },
      );

      useProductsStore.getState().updateProduct(payload.product_id as string, {
        image_path: path,
      });

      await deleteLocalProductImage(payload.local_uri as string);
      await syncQueue.markSynced(item.id);
    }

    if (
      item.table_name === "inventory_transactions" &&
      item.operation === "insert"
    ) {
      const { transaction, product_id, organization_id, new_quantity } =
        payload;

      // 1. Insert remote transaction
      const { error: txnError } = await supabase
        .from("inventory_transactions")
        .insert({
          id: transaction.id,
          organization_id: transaction.organization_id,
          product_id: transaction.product_id,
          type: transaction.type,
          quantity_delta: transaction.quantity_delta,
          reference_type: transaction.reference_type,
          reference_id: transaction.reference_id,
          notes: transaction.notes,
          performed_by: transaction.performed_by,
          created_at: transaction.created_at,
        });

      if (txnError) throw txnError;

      // 2. Update remote product quantity
      const { data: product, error: productError } = await supabase
        .from("products")
        .update({
          quantity: new_quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product_id)
        .eq("organization_id", organization_id)
        .select()
        .single();

      if (productError) throw productError;
      if (product) await productLocal.upsertOne(product);
    }

    if (item.table_name === "categories") {
      const payload = JSON.parse(item.payload);

      if (item.operation === "insert") {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      } else if (item.operation === "update") {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", item.record_id)
          .eq("organization_id", payload.organization_id);
        if (error) throw error;
      } else if (item.operation === "delete") {
        const { error } = await supabase
          .from("categories")
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.record_id)
          .eq("organization_id", payload.organization_id);
        if (error) throw error;
      }

      await syncQueue.markSynced(item.id);
    }

    if (item.table_name === "suppliers") {
      const payload = JSON.parse(item.payload);

      if (item.operation === "insert") {
        const { error } = await supabase.from("suppliers").insert(payload);
        if (error) throw error;
      } else if (item.operation === "update") {
        const { error } = await supabase
          .from("suppliers")
          .update(payload)
          .eq("id", item.record_id)
          .eq("organization_id", payload.organization_id);
        if (error) throw error;
      } else if (item.operation === "delete") {
        const { error } = await supabase
          .from("suppliers")
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.record_id)
          .eq("organization_id", payload.organization_id);
        if (error) throw error;
      }

      await syncQueue.markSynced(item.id);
    }

    await syncQueue.markSynced(item.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    await syncQueue.markError(item.id, message);
    throw err;
  }
}

let flushing = false;

export const syncEngine = {
  async flush() {
    if (flushing) return;
    if (!getNetworkOnline()) return;

    flushing = true;
    useUIStore.getState().setSyncing(true);

    try {
      const pending = await syncQueue.getPending(30);
      for (const item of pending) {
        try {
          await processItem(item);
        } catch (error: any) {
          console.warn("Failed to sync item", item.id, error);

          if (
            error?.code === "23505" && item.table_name === "products" &&
            item.operation === "insert"
          ) {
            const payload = JSON.parse(item.payload);

            // Find the existing server row by natural key
            const existing = await findProductByBarcode(
              payload.barcode,
            );

            // console.log(existing);
            if (existing) {
              await productLocal.upsertOne(existing);
              useProductsStore.getState().updateProduct(payload.id, existing);
              // or replace local id references

              await syncQueue.markSynced(item.id); // stop retrying forever
              return;
            }
          }
          // continue with next items
        }
      }
    } finally {
      flushing = false;
      useUIStore.getState().setSyncing(false);
    }
  },

  async pendingCount() {
    return syncQueue.pendingCount();
  },
};
