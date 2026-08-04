import { useAuthStore, useProductsStore } from "@/stores";
import { useEffect } from "react";

/**
 * Thin hook that binds the products store to the current organization.
 * Does NOT refetch on every focus – only when org changes or list is empty.
 */
export function useProducts() {
  const organization = useAuthStore((s) => s.currentOrganization);

  const products = useProductsStore((s) => s.products);
  const loading = useProductsStore((s) => s.loading);
  const refreshing = useProductsStore((s) => s.refreshing);
  const error = useProductsStore((s) => s.error);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const refreshProducts = useProductsStore((s) => s.refreshProducts);

  useEffect(() => {
    if (organization?.id) {
      fetchProducts(organization.id);
    }
  }, [organization?.id, fetchProducts]);

  return {
    products,
    loading,
    refreshing,
    error,
    onRefresh: () => {
      if (organization?.id) {
        refreshProducts(organization.id);
      }
    },
    refetch: () => {
      if (organization?.id) {
        fetchProducts(organization.id, { force: true });
      }
    },
  };
}
