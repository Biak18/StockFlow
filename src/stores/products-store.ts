import { productRepository } from "@/features/products/services/product-repository";
import type { Product } from "@/features/products/types";
import { create } from "zustand";

interface ProductsState {
  products: Product[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  currentOrganizationId: string | null;

  /** Fetch products for an organization (skips if already loaded for same org unless force) */
  fetchProducts: (
    organizationId: string,
    options?: { force?: boolean },
  ) => Promise<void>;

  /** Pull-to-refresh */
  refreshProducts: (organizationId: string) => Promise<void>;

  /** Add a product to the local list (after create) */
  addProduct: (product: Product) => void;

  /** Update a product in the local list */
  updateProduct: (id: string, patch: Partial<Product>) => void;

  /** Remove a product from the local list (after soft delete) */
  removeProduct: (id: string) => void;

  /** Replace entire list (rarely needed) */
  setProducts: (products: Product[]) => void;

  /** Reset when signing out / switching org */
  reset: () => void;
}

const initialState = {
  products: [] as Product[],
  loading: false,
  refreshing: false,
  error: null as string | null,
  lastFetchedAt: null as number | null,
  currentOrganizationId: null as string | null,
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  ...initialState,

  fetchProducts: async (organizationId, options = {}) => {
    const { force = false } = options;
    const state = get();

    // Skip network if we already have data for this org (unless forced)
    if (
      !force &&
      state.currentOrganizationId === organizationId &&
      state.products.length > 0 &&
      state.lastFetchedAt
    ) {
      return;
    }

    set({
      loading: state.products.length === 0, // only show full loader if empty
      error: null,
      currentOrganizationId: organizationId,
    });

    try {
      const data = await productRepository.list(organizationId);
      set({
        products: data,
        loading: false,
        lastFetchedAt: Date.now(),
        error: null,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load products",
      });
    }
  },

  refreshProducts: async (organizationId) => {
    set({ refreshing: true, error: null });

    try {
      const data = await productRepository.list(organizationId);
      set({
        products: data,
        refreshing: false,
        lastFetchedAt: Date.now(),
        currentOrganizationId: organizationId,
        error: null,
      });
    } catch (err) {
      set({
        refreshing: false,
        error:
          err instanceof Error ? err.message : "Failed to refresh products",
      });
    }
  },

  addProduct: (product) => {
    set((state) => ({
      products: [product, ...state.products].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
  },

  updateProduct: (id, patch) => {
    set((state) => ({
      products: state.products
        .map((p) => (p.id === id ? { ...p, ...patch } : p))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },

  removeProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  setProducts: (products) => set({ products }),

  reset: () => set({ ...initialState }),
}));
