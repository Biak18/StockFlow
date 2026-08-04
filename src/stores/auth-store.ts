import { Organization, OrganizationMember, Profile, Role } from "@/types";
import { create } from "zustand";

interface AuthState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  session: any | null; // Supabase Session
  profile: Profile | null;
  currentOrganization: Organization | null;
  membership: OrganizationMember | null;
  role: Role | null;

  isResolvingOrg: boolean;

  setInitialized: (value: boolean) => void;
  setSession: (session: any | null) => void;
  setProfile: (profile: Profile | null) => void;
  setOrganization: (
    org: Organization | null,
    membership: OrganizationMember | null,
  ) => void;
  setResolvingOrg: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  isInitialized: false,
  isAuthenticated: false,
  session: null,
  profile: null,
  currentOrganization: null,
  membership: null,
  role: null,
  isResolvingOrg: false,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setInitialized: (value) => set({ isInitialized: value }),

  setSession: (session) =>
    set({
      session,
      isAuthenticated: !!session,
    }),

  setProfile: (profile) => set({ profile }),

  setOrganization: (org, membership) =>
    set({
      currentOrganization: org,
      membership,
      role: membership?.role ?? null,
    }),

  reset: () => set({ ...initialState, isInitialized: true }),

  setResolvingOrg: (v) => set({ isResolvingOrg: v }),
}));
