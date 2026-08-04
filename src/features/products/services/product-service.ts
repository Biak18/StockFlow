import { supabase } from "@/services/supabase";
import type { Product, ProductInsert, ProductUpdate } from "../types";

function mapError(error: { message: string; code?: string }): Error {
  return new Error(error.message || "Something went wrong");
}

export const productService = {
  /**
   * List all products for the current organization (not soft-deleted)
   */
  async list(organizationId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) throw mapError(error);
    return data ?? [];
  },

  /**
   * Get a single product
   */
  async getById(id: string, organizationId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw mapError(error);
    return data;
  },

  /**
   * Create a product
   */
  async create(payload: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...payload,
        sku: payload.sku || null,
        barcode: payload.barcode || null,
        description: payload.description || null,
        quantity: payload.quantity ?? 0,
      })
      .select()
      .single();

    if (error) throw mapError(error);
    return data;
  },

  /**
   * Update a product
   */
  async update(
    id: string,
    organizationId: string,
    payload: ProductUpdate,
  ): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) throw mapError(error);
    return data;
  },

  /**
   * Soft delete a product
   */
  async softDelete(id: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from("products")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) throw mapError(error);
  },
};
