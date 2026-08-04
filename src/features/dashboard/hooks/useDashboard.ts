import { useAuthStore, useProductsStore, useUIStore } from "@/stores";
import { useCallback, useEffect, useMemo, useState } from "react";
import { computeStats, dashboardService } from "../services/dashboard-service";
import type { RecentMovement } from "../types";

export function useDashboard() {
  const organization = useAuthStore((s) => s.currentOrganization);
  const products = useProductsStore((s) => s.products);
  const productsLoading = useProductsStore((s) => s.loading);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const [movements, setMovements] = useState<RecentMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const stats = useMemo(() => computeStats(products), [products]);
  const inventoryRevision = useUIStore((s) => s.inventoryRevision);

  const loadMovements = useCallback(async () => {
    if (!organization?.id) {
      setMovements([]);
      return;
    }

    try {
      setMovementsError(null);
      setMovementsLoading(true);
      const data = await dashboardService.getRecentMovements(
        organization.id,
        10,
      );
      setMovements(data);
    } catch (err) {
      setMovementsError(
        err instanceof Error ? err.message : "Failed to load recent activity",
      );
    } finally {
      setMovementsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (organization?.id) {
      fetchProducts(organization.id);
      loadMovements();
    }
  }, [organization?.id, fetchProducts, loadMovements]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements, inventoryRevision]);

  const onRefresh = useCallback(async () => {
    if (!organization?.id) return;
    setRefreshing(true);
    await Promise.all([
      fetchProducts(organization.id, { force: true }),
      loadMovements(),
    ]);
    setRefreshing(false);
  }, [organization?.id, fetchProducts, loadMovements]);

  return {
    stats,
    movements,
    loading: productsLoading && products.length === 0,
    movementsLoading,
    movementsError,
    refreshing,
    onRefresh,
  };
}
