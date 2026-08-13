import { categoryLocal } from "@/services/database/category-local";
import { getNetworkOnline } from "@/services/network";
import { syncQueue } from "@/services/sync/sync-queue";
import type { Category } from "../types";
import { categoryService } from "./category-service";

function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function toRemoteCategory(row: Category) {
    return {
        id: row.id,
        organization_id: row.organization_id,
        name: row.name,
        description: row.description ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at ?? null,
    };
}

export const categoryRepository = {
    async list(organizationId: string): Promise<Category[]> {
        if (getNetworkOnline()) {
            try {
                const remote = await categoryService.list(organizationId);
                const active = remote.filter((c) => !c.deleted_at);
                await categoryLocal.replaceAll(organizationId, active);
                return active;
            } catch (e) {
                console.warn(
                    "Remote category list failed, using local cache",
                    e,
                );
            }
        }
        return categoryLocal.list(organizationId);
    },

    async create(
        organizationId: string,
        input: { name: string; description?: string | null },
    ): Promise<Category> {
        const now = new Date().toISOString();

        if (getNetworkOnline()) {
            try {
                const created = await categoryService.create({
                    organization_id: organizationId,
                    name: input.name.trim(),
                    description: input.description?.trim() || null,
                });
                await categoryLocal.upsertOne(created);
                return created;
            } catch (e) {
                console.warn(
                    "Remote category create failed, queueing offline",
                    e,
                );
            }
        }

        const row: Category = {
            id: uuid(),
            organization_id: organizationId,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            created_at: now,
            updated_at: now,
            deleted_at: null,
            version: 0,
        };

        await categoryLocal.upsertOne(row);
        await syncQueue.enqueue({
            tableName: "categories",
            recordId: row.id,
            operation: "insert",
            payload: toRemoteCategory(row),
        });
        return row;
    },

    async update(
        id: string,
        organizationId: string,
        input: { name: string; description?: string | null },
    ): Promise<Category> {
        const now = new Date().toISOString();

        if (getNetworkOnline()) {
            try {
                const updated = await categoryService.update(
                    id,
                    organizationId,
                    {
                        name: input.name.trim(),
                        description: input.description?.trim() || null,
                    },
                );
                await categoryLocal.upsertOne(updated);
                return updated;
            } catch (e) {
                console.warn(
                    "Remote category update failed, queueing offline",
                    e,
                );
            }
        }

        const existing = await categoryLocal.getById(id, organizationId);
        if (!existing) {
            throw new Error("Category not found in local cache");
        }

        const row: Category = {
            ...existing,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            updated_at: now,
        };

        await categoryLocal.upsertOne(row);
        await syncQueue.enqueue({
            tableName: "categories",
            recordId: row.id,
            operation: "update",
            payload: toRemoteCategory(row),
        });
        return row;
    },

    async remove(id: string, organizationId: string): Promise<void> {
        if (getNetworkOnline()) {
            try {
                await categoryService.softDelete(id, organizationId);
                await categoryLocal.softDelete(id, organizationId);
                return;
            } catch (e) {
                console.warn(
                    "Remote category delete failed, queueing offline",
                    e,
                );
            }
        }

        await categoryLocal.softDelete(id, organizationId);
        await syncQueue.enqueue({
            tableName: "categories",
            recordId: id,
            operation: "delete",
            payload: { id, organization_id: organizationId },
        });
    },
};
