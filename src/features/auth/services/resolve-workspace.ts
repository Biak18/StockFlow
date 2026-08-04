import { inviteService } from "@/features/team";
import type { Organization, OrganizationMember } from "@/types";
import { authService } from "./auth-service";

/**
 * After auth: membership first, else accept invite, else null (create org).
 */
export async function resolveWorkspace(userId: string): Promise<{
  organization: Organization;
  membership: OrganizationMember;
} | null> {
  const existing = await authService.getMembership(userId);

  if (existing?.organization && existing?.membership) {
    return {
      organization: existing.organization,
      membership: existing.membership,
    };
  }

  // Shape variants from your service
  if (existing?.organization && existing?.membership === undefined) {
    // if getMembership returns membership row differently, adapt here
  }

  const accepted = await inviteService.acceptPending();
  if (accepted) return accepted;

  return null;
}
