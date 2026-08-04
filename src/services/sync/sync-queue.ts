import { getDatabase } from "@/database";

export type SyncOperation = "insert" | "update" | "delete";

export interface SyncQueueItem {
  id: string;
  table_name: string;
  record_id: string;
  operation: SyncOperation;
  payload: string; // JSON
  status: "pending" | "syncing" | "synced" | "error";
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const syncQueue = {
  async enqueue(params: {
    tableName: string;
    recordId: string;
    operation: SyncOperation;
    payload: Record<string, unknown>;
  }) {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id = uuid();

    await db.runAsync(
      `INSERT INTO sync_queue (
        id, table_name, record_id, operation, payload, status, attempts, last_error, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', 0, NULL, ?, ?)`,
      [
        id,
        params.tableName,
        params.recordId,
        params.operation,
        JSON.stringify(params.payload),
        now,
        now,
      ],
    );

    return id;
  },

  async getPending(limit = 50): Promise<SyncQueueItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SyncQueueItem>(
      `SELECT * FROM sync_queue
       WHERE status IN ('pending', 'error')
       ORDER BY created_at ASC
       LIMIT ?`,
      [limit],
    );
    return rows;
  },

  async markSyncing(id: string) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE sync_queue SET status = 'syncing', updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), id],
    );
  },

  async markSynced(id: string) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE sync_queue SET status = 'synced', updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), id],
    );
  },

  async markError(id: string, error: string) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE sync_queue
       SET status = 'error', attempts = attempts + 1, last_error = ?, updated_at = ?
       WHERE id = ?`,
      [error, new Date().toISOString(), id],
    );
  },

  async pendingCount(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'error')`,
    );
    return row?.count ?? 0;
  },
};
