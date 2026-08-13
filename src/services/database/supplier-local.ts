import { getDatabase } from "@/database";
import type { Supplier } from "@/features/suppliers/types";

export const supplierLocal = {
    async list(organizationId: string): Promise<Supplier[]> {
        const db = await getDatabase();
        const rows = await db.getAllAsync<Supplier>(
            `SELECT * FROM suppliers
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
    ): Promise<Supplier | null> {
        const db = await getDatabase();
        const row = await db.getFirstAsync<Supplier>(
            `SELECT * FROM suppliers
       WHERE id = ? AND organization_id = ?
         AND (deleted_at IS NULL OR deleted_at = '')`,
            [id, organizationId],
        );
        return row ?? null;
    },

    async upsertOne(row: Supplier): Promise<void> {
        const db = await getDatabase();
        await db.runAsync(
            `INSERT INTO suppliers (
        id, organization_id, name, email,phone,address,notes,
        created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        organization_id = excluded.organization_id,
        name = excluded.name,
        email = excluded.email,
        phone = excluded.phone,
        address = excluded.address,
        notes = excluded.notes,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at`,
            [
                row.id,
                row.organization_id,
                row.name,
                row.email,
                row.phone,
                row.address,
                row.notes,
                row.created_at,
                row.updated_at,
                row.deleted_at ?? null,
            ],
        );
    },

    async replaceAll(organizationId: string, rows: Supplier[]): Promise<void> {
        const db = await getDatabase();
        await db.execAsync("BEGIN");
        try {
            await db.runAsync(
                `DELETE FROM suppliers WHERE organization_id = ?`,
                [
                    organizationId,
                ],
            );
            for (const row of rows) {
                await db.runAsync(
                    `INSERT INTO suppliers (
            id, organization_id, name, email,phone,address,notes,
            created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        row.id,
                        row.organization_id,
                        row.name,
                        row.email,
                        row.phone,
                        row.address,
                        row.notes,
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
            `UPDATE suppliers
       SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND organization_id = ?`,
            [now, now, id, organizationId],
        );
    },
};
