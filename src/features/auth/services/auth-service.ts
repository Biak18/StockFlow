import { supabase } from "@/services/supabase";
import type {
  Organization,
  OrganizationMember,
  Profile,
  Role,
  UUID,
} from "@/types";
import type {
  LoginFormValues,
  RegisterFormValues,
} from "../schemas/auth-schemas";

interface CreateOrganizationRow {
  organization_id: UUID;
  organization_name: string;
  organization_created_at: string;
  organization_updated_at: string;
  membership_id: UUID;
  membership_organization_id: UUID;
  membership_user_id: UUID;
  membership_role: Role;
  membership_created_at: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function mapSupabaseError(error: {
  message: string;
  status?: number;
  code?: string;
}): AuthError {
  const msg = error.message?.toLowerCase() ?? "";

  if (msg.includes("invalid login credentials")) {
    return new AuthError("Invalid email or password", "invalid_credentials");
  }
  if (
    msg.includes("user already registered") ||
    msg.includes("already been registered")
  ) {
    return new AuthError(
      "An account with this email already exists",
      "email_taken",
    );
  }
  if (msg.includes("password")) {
    return new AuthError(error.message, "weak_password");
  }
  if (msg.includes("email")) {
    return new AuthError(error.message, "email_error");
  }

  return new AuthError(
    error.message || "Something went wrong. Please try again.",
    error.code,
  );
}

export const authService = {
  /**
   * Sign in with email + password
   */
  async signIn({ email, password }: LoginFormValues) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw mapSupabaseError(error);
    return data;
  },

  /**
   * Register a new user.
   * Profile row is created automatically by the database trigger.
   */
  async signUp({ fullName, email, password }: RegisterFormValues) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) throw mapSupabaseError(error);
    return data;
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: "stockflow://reset-password", // deep link – configure later
      },
    );

    if (error) throw mapSupabaseError(error);
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw mapSupabaseError(error);
  },

  /**
   * Get the current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw mapSupabaseError(error);
    return data.session;
  },

  /**
   * Load the current user's profile
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw mapSupabaseError(error);
    return data;
  },

  /**
   * Load the user's organization memberships (first one for v1)
   */
  async getMembership(userId: string): Promise<{
    membership: OrganizationMember | null;
    organization: Organization | null;
  }> {
    const { data, error } = await supabase
      .from("organization_members")
      .select(
        `
        id,
        organization_id,
        user_id,
        role,
        created_at,
        organizations (
          id,
          name,
          created_at,
          updated_at
        )
      `,
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (error) throw mapSupabaseError(error);

    if (!data) {
      return { membership: null, organization: null };
    }

    const organization = Array.isArray(data.organizations)
      ? data.organizations[0]
      : data.organizations;

    return {
      membership: {
        id: data.id,
        organization_id: data.organization_id,
        user_id: data.user_id,
        role: data.role,
        created_at: data.created_at,
      },
      organization: organization ?? null,
    };
  },

  /**
   * Create a new organization and make the current user the owner.
   * Used when a user has no organization yet.
   */
  async createOrganization(
    name: string,
  ): Promise<{ organization: Organization; membership: OrganizationMember }> {
    const { data, error } = await supabase.rpc("create_organization", {
      org_name: name.trim(),
    });

    if (error) throw mapSupabaseError(error);

    const row = (Array.isArray(data) ? data[0] : data) as CreateOrganizationRow;

    if (!row) {
      throw new Error("Organization creation returned no data");
    }

    const organization: Organization = {
      id: row.organization_id,
      name: row.organization_name,
      created_at: row.organization_created_at,
      updated_at: row.organization_updated_at,
    };

    const membership: OrganizationMember = {
      id: row.membership_id,
      organization_id: row.membership_organization_id,
      user_id: row.membership_user_id,
      role: row.membership_role,
      created_at: row.membership_created_at,
    };

    return { organization, membership };
  },
};
