import type { UUID } from "@/types";

export interface Category {
  id: UUID;
  organization_id: UUID;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  version: number;
}
