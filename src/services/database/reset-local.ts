// src/services/database/reset-local.ts
import { getDatabase } from "@/database/client";
import {
    useCategoriesStore,
    useProductsStore,
    useSuppliersStore,
} from "@/stores";
import * as FileSystem from "expo-file-system/legacy";

const IMAGE_DIR = `${FileSystem.documentDirectory}product-images/`;

export async function resetLocalData() {
    const db = await getDatabase();

    await db.execAsync(`
    DELETE FROM sync_queue;
    DELETE FROM products;
    DELETE FROM inventory_transactions;
    DELETE FROM categories;
    DELETE FROM suppliers;
  `);
    // list every local table you use

    try {
        const info = await FileSystem.getInfoAsync(IMAGE_DIR);
        if (info.exists) {
            await FileSystem.deleteAsync(IMAGE_DIR, { idempotent: true });
        }
    } catch {
        // ignore
    }

    useProductsStore.getState().reset?.() ??
        useProductsStore.setState({ products: [], error: null });
    useCategoriesStore.getState().reset?.() ??
        useCategoriesStore.setState({ categories: [] });
    useSuppliersStore.getState().reset?.() ??
        useSuppliersStore.setState({ suppliers: [] });
}
