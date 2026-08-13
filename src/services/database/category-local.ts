import { getDatabase } from "@/database";
import type { Category } from "@/features/categories/types";

export const categoryLocal = {
    async list(organizationId: string): Promise<Category[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<Category>(
            `SELECT * FROM categories
       WHERE organization_id = ?
         AND (deleted_at IS NULL OR deleted_at = '')
       ORDER BY name COLLATE NOCASE ASC`,
            [organizationId],
        );
        return rows;
    },

    async getById(
        id: string,
        organizationId: string,
    ): Promise<Category | null> {
        const db = await getDatabase();
        const row = await db.getFirstAsync<Category>(
            `SELECT * FROM categories
       WHERE id = ? AND organization_id = ?
         AND (deleted_at IS NULL OR deleted_at = '')`,
            [id, organizationId],
        );
        return row ?? null;
    },

    async upsertOne(row: Category): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT INTO categories (
        id, organization_id, name, description,
        created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        organization_id = excluded.organization_id,
        name = excluded.name,
        description = excluded.description,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at`,
            [
                row.id,
                row.organization_id,
                row.name,
                row.description ?? null,
                row.created_at,
                row.updated_at,
                row.deleted_at ?? null,
            ],
        );
    },

    async replaceAll(organizationId: string, rows: Category[]): Promise<void> {
        const db = await getDatabase();
        await db.execAsync("BEGIN");
        try {
            await db.runAsync(
                `DELETE FROM categories WHERE organization_id = ?`,
                [
                    organizationId,
                ],
            );
            for (const row of rows) {
                await db.runAsync(
                    `INSERT INTO categories (
            id, organization_id, name, description,
            created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        row.id,
                        row.organization_id,
                        row.name,
                        row.description ?? null,
                        row.created_at,
                        row.updated_at,
                        row.deleted_at ?? null,
                    ],
                );
            }
            await db.execAsync("COMMIT");
        } catch (e) {
            await db.execAsync("ROLLBACK");
            throw e;
        }
    },

    async softDelete(id: string, organizationId: string): Promise<void> {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.runAsync(
            `UPDATE categories
       SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND organization_id = ?`,
            [now, now, id, organizationId],
        );
    },
};
