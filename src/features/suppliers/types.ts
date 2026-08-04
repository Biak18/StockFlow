import type { UUID } from "@/types";

export interface Supplier {
  id: UUID;
  organization_id: UUID;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
}
