import { useProductsStore } from "@/stores";

/**
 * Look up a product by barcode from the in-memory store first.
 * Fast and works offline once products are loaded.
 */
export function findProductByBarcode(barcode: string) {
  const normalized = barcode.trim();
  if (!normalized) return null;

  const products = useProductsStore.getState().products;
  return (
    products.find((p) => p.barcode && p.barcode.trim() === normalized) ?? null
  );
}
