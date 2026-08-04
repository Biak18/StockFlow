export interface DashboardStats {
  totalProducts: number;
  totalUnits: number;
  inventoryValueCost: number;
  inventoryValueSelling: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface RecentMovement {
  id: string;
  type: "in" | "out" | "adjustment" | "transfer";
  quantity_delta: number;
  created_at: string;
  notes: string | null;
  product_id: string;
  product_name?: string;
}
