import { supabase } from "@/services/supabase";
import type { MemberRole, OrgMemberRow } from "../types";

export const memberService = {
    async list(organizationId: string): Promise<OrgMemberRow[]> {
        const { data, error } = await supabase
            .from("organization_members")
            .select(
                `
        id,
        organization_id,
        user_id,
        role,
        created_at,
        profile:profiles (
          id,
          full_name,
          email
        )
      `,
            )
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: true });

        if (error) throw new Error(error.message);

        return (data ?? []).map((row: any) => ({
            id: row.id,
            organization_id: row.organization_id,
            user_id: row.user_id,
            role: row.role,
            created_at: row.created_at,
            profile: Array.isArray(row.profile) ? row.profile[0] : row.profile,
        }));
    },

    async updateRole(memberId: string, role: Exclude<MemberRole, "owner">) {
        const { data, error } = await supabase.rpc("update_member_role", {
            p_member_id: memberId,
            p_role: role,
        });

        if (error) throw new Error(error.message);
        return data;
    },

    async remove(memberId: string) {
        const { error } = await supabase.rpc("remove_organization_member", {
            p_member_id: memberId,
        });

        if (error) throw new Error(error.message);
    },
};
