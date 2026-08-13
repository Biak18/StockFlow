import { categoryRepository } from "@/features/categories/services/category-repository";
import type { Category } from "@/features/categories/types";
import { create } from "zustand";

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  currentOrganizationId: string | null;

  fetchCategories: (
    organizationId: string,
    options?: { force?: boolean },
  ) => Promise<void>;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  reset: () => void;
}

const initialState = {
  categories: [] as Category[],
  loading: false,
  error: null as string | null,
  currentOrganizationId: null as string | null,
};

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  ...initialState,

  fetchCategories: async (organizationId, options = {}) => {
    const { force = false } = options;
    const state = get();

    if (
      !force &&
      state.currentOrganizationId === organizationId &&
      state.categories.length > 0
    ) {
      return;
    }

    set({
      loading: state.categories.length === 0,
      error: null,
      currentOrganizationId: organizationId,
    });

    try {
      const data = await categoryRepository.list(organizationId);
      set({ categories: data, loading: false, error: null });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load categories",
      });
    }
  },

  addCategory: (category) => {
    set((state) => ({
      categories: [...state.categories, category].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));
  },

  updateCategory: (id, patch) => {
    set((state) => ({
      categories: state.categories
        .map((c) => (c.id === id ? { ...c, ...patch } : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },

  removeCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  reset: () => set({ ...initialState }),
}));
