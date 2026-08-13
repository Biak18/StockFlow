import { supplierRepository } from "@/features/suppliers/services/supplier-repository";
import type { Supplier } from "@/features/suppliers/types";
import { create } from "zustand";

interface SuppliersState {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  currentOrganizationId: string | null;

  fetchSuppliers: (
    organizationId: string,
    options?: { force?: boolean },
  ) => Promise<void>;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  removeSupplier: (id: string) => void;
  reset: () => void;
}

const initialState = {
  suppliers: [] as Supplier[],
  loading: false,
  error: null as string | null,
  currentOrganizationId: null as string | null,
};

export const useSuppliersStore = create<SuppliersState>((set, get) => ({
  ...initialState,

  fetchSuppliers: async (organizationId, options = {}) => {
    const { force = false } = options;
    const state = get();

    if (
      !force &&
      state.currentOrganizationId === organizationId &&
      state.suppliers.length > 0
    ) {
      return;
    }

    set({
      loading: state.suppliers.length === 0,
      error: null,
      currentOrganizationId: organizationId,
    });

    try {
      const data = await supplierRepository.list(organizationId);
      set({ suppliers: data, loading: false, error: null });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load suppliers",
      });
    }
  },

  addSupplier: (supplier) => {
    set((state) => ({
      suppliers: [...state.suppliers, supplier].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));
  },

  updateSupplier: (id, patch) => {
    set((state) => ({
      suppliers: state.suppliers
        .map((s) => (s.id === id ? { ...s, ...patch } : s))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },

  removeSupplier: (id) => {
    set((state) => ({
      suppliers: state.suppliers.filter((s) => s.id !== id),
    }));
  },

  reset: () => set({ ...initialState }),
}));
