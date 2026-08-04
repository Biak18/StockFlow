export type InviteRole = "admin" | "member";
export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

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
