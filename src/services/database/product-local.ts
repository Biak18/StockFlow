import { getDatabase } from "@/database";
import type { Product } from "@/features/products/types";

export const productLocal = {
  async upsertMany(products: Product[]) {
    if (products.length === 0) return;
    const database = await getDatabase();

    for (const p of products) {
      await database.runAsync(
        `INSERT OR REPLACE INTO products (
        id, organization_id, name, sku, barcode, category_id, supplier_id,
        cost_price, selling_price, quantity, unit, image_path, description,
        min_stock_level, created_at, updated_at, deleted_at, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.organization_id,
          p.name,
          p.sku,
          p.barcode,
          p.category_id,
          p.supplier_id,
          p.cost_price,
          p.selling_price,
          p.quantity,
          p.unit,
          p.image_path,
          p.description,
          p.min_stock_level,
          p.created_at,
          p.updated_at,
          p.deleted_at,
          p.version,
        ],
      );
    }
  },

  async list(organizationId: string): Promise<Product[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Product>(
      `SELECT * FROM products
       WHERE organization_id = ? AND deleted_at IS NULL
       ORDER BY name ASC`,
      [organizationId],
    );
    return rows;
  },

  async getById(id: string, organizationId: string): Promise<Product | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Product>(
      `SELECT * FROM products
       WHERE id = ? AND organization_id = ? AND deleted_at IS NULL`,
      [id, organizationId],
    );
    return row ?? null;
  },

  async upsertOne(product: Product) {
    await this.upsertMany([product]);
  },

  async softDelete(id: string, organizationId: string) {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE products SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND organization_id = ?`,
      [now, now, id, organizationId],
    );
  },
};
