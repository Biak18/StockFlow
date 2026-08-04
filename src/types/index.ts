export type UUID = string;

export type Role = "owner" | "admin" | "manager" | "staff" | "viewer";

export interface Organization {
  id: UUID;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: UUID;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: UUID;
  organization_id: UUID;
  user_id: UUID;
  role: Role;
  created_at: string;
}

export type SyncStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "error"
  | "conflict";
