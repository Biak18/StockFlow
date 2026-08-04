import type { Product } from "@/features/products/types";
import { supabase } from "@/services/supabase";
import type { DashboardStats, RecentMovement } from "../types";

export function computeStats(products: Product[]): DashboardStats {
  let totalUnits = 0;
  let inventoryValueCost = 0;
  let inventoryValueSelling = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of products) {
    totalUnits += p.quantity;
    inventoryValueCost += p.quantity * p.cost_price;
    inventoryValueSelling += p.quantity * p.selling_price;

    if (p.quantity <= 0) {
      outOfStockCount += 1;
    } else if (p.min_stock_level > 0 && p.quantity <= p.min_stock_level) {
      lowStockCount += 1;
    }
  }

  return {
    totalProducts: products.length,
    totalUnits,
    inventoryValueCost,
    inventoryValueSelling,
    lowStockCount,
    outOfStockCount,
  };
}

export const dashboardService = {
  async getRecentMovements(
    organizationId: string,
    limit = 10,
  ): Promise<RecentMovement[]> {
    const { data, error } = await supabase
      .from("inventory_transactions")
      .select(
        `
        id,
        type,
        quantity_delta,
        created_at,
        notes,
        product_id,
        products ( name )
      `,
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      quantity_delta: row.quantity_delta,
      created_at: row.created_at,
      notes: row.notes,
      product_id: row.product_id,
      product_name: row.products?.name ?? "Unknown product",
    }));
  },
};
