import { useAuthStore, useProductsStore } from "@/stores";
import { useCallback, useEffect, useState } from "react";
import { productRepository } from "../services/product-repository";
import type { Product } from "../types";

export function useProduct(productId: string | undefined) {
  const organization = useAuthStore((s) => s.currentOrganization);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storeProduct = useProductsStore((s) =>
    productId ? (s.products.find((p) => p.id === productId) ?? null) : null,
  );

  const fetchProduct = useCallback(async () => {
    if (!productId || !organization?.id) {
      setProduct(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const data = await productRepository.getById(productId, organization.id);
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, organization?.id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (storeProduct) {
      setProduct(storeProduct);
      setLoading(false);
    }
  }, [storeProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}
