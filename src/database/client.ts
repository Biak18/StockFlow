import * as SQLite from "expo-sqlite";
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from "./schema";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync("stockflow.db");

  // Critical pragmas + schema in one go
  await database.execAsync(CREATE_TABLES_SQL);

  await database.runAsync(
    `INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`,
    ["schema_version", String(SCHEMA_VERSION)],
  );

  return database;
}

/**
 * Always use this. Never cache the DB outside this module.
 * Concurrent callers share the same init promise (no race).
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  if (!initPromise) {
    initPromise = initDatabase()
      .then((database) => {
        db = database;
        return database;
      })
      .catch((err) => {
        // Allow retry on next call
        initPromise = null;
        db = null;
        throw err;
      });
  }

  return initPromise;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    initPromise = null;
  }
}
