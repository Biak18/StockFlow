import type { Product } from "@/features/products/types";
import { supabase } from "@/services/supabase";
import type { InventoryTxnType } from "../types";

function mapError(error: { message: string }) {
  return new Error(error.message || "Something went wrong");
}

export const inventoryService = {
  /**
   * Apply a stock movement:
   * 1. Insert inventory_transactions
   * 2. Update products.quantity
   * Returns the updated product.
   */
  async applyMovement(params: {
    organizationId: string;
    productId: string;
    type: InventoryTxnType;
    quantity: number; // always positive from the form
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
    else if (type === "adjustment") {
      // For adjustment, treat quantity as the *new absolute* stock level
      delta = quantity - currentQuantity;
    }

    const newQuantity = currentQuantity + delta;
    if (newQuantity < 0) {
      throw new Error("Insufficient stock for this movement");
    }

    // 1. Insert transaction
    const { error: txnError } = await supabase
      .from("inventory_transactions")
      .insert({
        organization_id: organizationId,
        product_id: productId,
        type,
        quantity_delta: delta,
        notes: notes || null,
        performed_by: performedBy || null,
        reference_type: "manual",
      });

    if (txnError) throw mapError(txnError);

    // 2. Update product quantity
    const { data: product, error: productError } = await supabase
      .from("products")
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .select()
      .single();

    if (productError) throw mapError(productError);

    return product;
  },

  async listForProduct(
    organizationId: string,
    productId: string,
  ): Promise<
    {
      id: string;
      type: InventoryTxnType;
      quantity_delta: number;
      notes: string | null;
      created_at: string;
    }[]
  > {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select("id, type, quantity_delta, notes, created_at")
      .eq("organization_id", organizationId)
      .eq("product_id", productId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw mapError(error);
    return data ?? [];
  },
};
