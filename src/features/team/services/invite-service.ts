import { supabase } from "@/services/supabase";
import type { Organization, OrganizationMember } from "@/types";
import type { InviteRole, OrganizationInvite } from "../types";

export const inviteService = {
  async list(organizationId: string): Promise<OrganizationInvite[]> {
    const { data, error } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async create(params: {
    organizationId: string;
    email: string;
    role: InviteRole;
    invitedBy: string;
  }): Promise<OrganizationInvite> {
    const email = params.email.trim().toLowerCase();

    const { data, error } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: params.organizationId,
        email,
        role: params.role,
        invited_by: params.invitedBy,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          "An invite for this email already exists in this organization",
        );
      }
      throw new Error(error.message);
    }
    try {
      await this.sendEmail(data.id);
    } catch (err) {
      console.warn("Invite email failed", err);
      // Optional: surface soft warning to UI
    }
    return data;
  },

  async sendEmail(inviteId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      "send-invite-email",
      {
        body: { invite_id: inviteId },
      },
    );

    if (error) {
      throw new Error(error.message || "Failed to send invite email");
    }
    if (data?.error) {
      throw new Error(data.error);
    }
  },

  async revoke(id: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from("organization_invites")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .eq("status", "pending");

    if (error) throw new Error(error.message);
  },

  /**
   * Accept pending invite for the current auth user (by email).
   * Returns null if no pending invite.
   */
  async acceptPending(): Promise<
    {
      organization: Organization;
      membership: OrganizationMember;
    } | null
  > {
    const { data, error } = await supabase.rpc("accept_organization_invite");

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      organization: data.organization as Organization,
      membership: data.membership as OrganizationMember,
    };
  },
};
