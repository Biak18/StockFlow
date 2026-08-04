import { supabase } from "@/services/supabase";
import type { Supplier } from "../types";

function mapError(error: { message: string }) {
  return new Error(error.message || "Something went wrong");
}

export const supplierService = {
  async list(organizationId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from("suppliers")
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
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
  }): Promise<Supplier> {
    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        organization_id: payload.organization_id,
        name: payload.name,
        email: payload.email || null,
        phone: payload.phone || null,
        address: payload.address || null,
        notes: payload.notes || null,
      })
      .select()
      .single();

    if (error) throw mapError(error);
    return data;
  },

  async update(
    id: string,
    organizationId: string,
    payload: {
      name: string;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      notes?: string | null;
    },
  ): Promise<Supplier> {
    const { data, error } = await supabase
      .from("suppliers")
      .update({
        name: payload.name,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        address: payload.address ?? null,
        notes: payload.notes ?? null,
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
      .from("suppliers")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) throw mapError(error);
  },
};
