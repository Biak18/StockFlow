import { supplierLocal } from "@/services/database/supplier-local";
import { getNetworkOnline } from "@/services/network";
import { syncQueue } from "@/services/sync/sync-queue";
import type { Supplier } from "../types";
import { supplierService } from "./supplier-service";

function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function toRemoteSupplier(row: Supplier) {
    return {
        id: row.id,
        organization_id: row.organization_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at ?? null,
    };
}

export const supplierRepository = {
    async list(organizationId: string): Promise<Supplier[]> {
        if (getNetworkOnline()) {
            try {
                const remote = await supplierService.list(organizationId);
                const active = remote.filter((c) => !c.deleted_at);
                await supplierLocal.replaceAll(organizationId, active);
                return active;
            } catch (e) {
                console.warn(
                    "Remote supplier list failed, using local cache",
                    e,
                );
            }
        }
        return supplierLocal.list(organizationId);
    },

    async create(
        organizationId: string,
        input: {
            name: string;
            email?: string | null;
            phone?: string | null;
            address?: string | null;
            notes?: string | null;
        },
    ): Promise<Supplier> {
        const now = new Date().toISOString();

        if (getNetworkOnline()) {
            try {
                const created = await supplierService.create({
                    organization_id: organizationId,
                    name: input.name.trim(),
                    email: input.email?.trim() || null,
                    phone: input.phone?.trim(),
                    address: input.address,
                    notes: input.notes,
                });
                await supplierLocal.upsertOne(created);
                return created;
            } catch (e) {
                console.warn(
                    "Remote supplier create failed, queueing offline",
                    e,
                );
            }
        }

        const row: Supplier = {
            id: uuid(),
            organization_id: organizationId,
            name: input.name.trim(),
            email: input.email?.trim() || null,
            phone: input.phone?.trim() || null,
            address: input.address || null,
            notes: input.notes || null,
            created_at: now,
            updated_at: now,
            deleted_at: null,
            version: 0,
        };

        await supplierLocal.upsertOne(row);
        await syncQueue.enqueue({
            tableName: "suppliers",
            recordId: row.id,
            operation: "insert",
            payload: toRemoteSupplier(row),
        });
        return row;
    },

    async update(
        id: string,
        organizationId: string,
        input: {
            name: string;
            email?: string | null;
            phone?: string | null;
            address?: string | null;
            notes?: string | null;
        },
    ): Promise<Supplier> {
        const now = new Date().toISOString();

        if (getNetworkOnline()) {
            try {
                const updated = await supplierService.update(
                    id,
                    organizationId,
                    {
                        name: input.name.trim(),
                        email: input.email?.trim() || null,
                        phone: input.phone?.trim(),
                        address: input.address,
                        notes: input.notes,
                    },
                );
                await supplierLocal.upsertOne(updated);
                return updated;
            } catch (e) {
                console.warn(
                    "Remote supplier update failed, queueing offline",
                    e,
                );
            }
        }

        const existing = await supplierLocal.getById(id, organizationId);
        if (!existing) {
            throw new Error("Supplier not found in local cache");
        }

        const row: Supplier = {
            ...existing,
            name: input.name.trim(),
            email: input.email?.trim() || null,
            phone: input.phone?.trim() || null,
            address: input.address || null,
            notes: input.notes || null,
            updated_at: now,
        };

        await supplierLocal.upsertOne(row);
        await syncQueue.enqueue({
            tableName: "suppliers",
            recordId: row.id,
            operation: "update",
            payload: toRemoteSupplier(row),
        });
        return row;
    },

    async remove(id: string, organizationId: string): Promise<void> {
        if (getNetworkOnline()) {
            try {
                await supplierService.softDelete(id, organizationId); // soft-delete on server
                await supplierLocal.softDelete(id, organizationId);
                return;
            } catch (e) {
                console.warn(
                    "Remote supplier delete failed, queueing offline",
                    e,
                );
            }
        }

        await supplierLocal.softDelete(id, organizationId);
        await syncQueue.enqueue({
            tableName: "suppliers",
            recordId: id,
            operation: "delete",
            payload: { id, organization_id: organizationId },
        });
    },
};
