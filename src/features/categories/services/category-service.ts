import { supabase } from "@/services/supabase";
import type { Category } from "../types";

function mapError(error: { message: string }) {
  return new Error(error.message || "Something went wrong");
}

export const categoryService = {
  async list(organizationId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) throw mapError(error);
    return data ?? [];
  },

  async create(payload: {
    organization_id: string;
    name: string;
    description?: string | null;
  }): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        organization_id: payload.organization_id,
        name: payload.name,
        description: payload.description || null,
      })
      .select()
      .single();

    if (error) throw mapError(error);
    return data;
  },

  async update(
    id: string,
    organizationId: string,
    payload: { name: string; description?: string | null },
  ): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .update({
        name: payload.name,
        description: payload.description ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async softDelete(id: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from("categories")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) throw mapError(error);
  },
};
