import { Role } from "@/types";

export type InviteRole = Exclude<Role, "owner">;
export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";
export type MemberRole = "owner" | "admin" | "staff";

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  role: InviteRole;
  invited_by: string | null;
  token: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface OrgMemberRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}
