import { offlineDb, createLocalRecordId, createOperationId, type OfflineEntity, type OfflineRecord, type SyncQueueItem } from "./db";

const RETRY_BASE_MS = 10_000;
const MAX_RETRY_MS = 10 * 60_000;

type QueueInput = Pick<SyncQueueItem, "farmId" | "entity" | "operation" | "payload"> & {
  localId?: string;
  serverId?: string;
  baseUpdatedAt?: string;
  operationId?: string;
};

type SyncResponse = {
  serverId?: string;
  syncedAt?: string;
  serverUpdatedAt?: string;
  conflict?: Record<string, unknown>;
};
function ensureClient() {
  if (typeof window === "undefined") throw new Error("Offline storage is only available in the browser.");
}
function dispatch(name: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(name));
}
export async function queueOfflineMutation(input: QueueInput) {
  ensureClient();
  const now = new Date().toISOString();
  const localId = input.localId ?? createLocalRecordId();
  const operationId = input.operationId ?? createOperationId();

  await offlineDb.transaction("rw", offlineDb.records, offlineDb.syncQueue, async () => {
    const current = await offlineDb.records.get(localId);
    const currentQueue = await offlineDb.syncQueue.where("localId").equals(localId).filter((item) => item.status !== "failed").first();
    const operation = current?.syncStatus === "pending" && currentQueue?.operation === "create" && input.operation === "update" ? "create" : input.operation;
    const record: OfflineRecord = {
      ...current,
      localId,
      serverId: input.serverId ?? current?.serverId,
      farmId: input.farmId,
      entity: input.entity,
      data: input.payload,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
      deletedAt: operation === "delete" ? now : undefined,
      syncStatus: "pending",
    };
    await offlineDb.records.put(record);
    if (currentQueue) {
      await offlineDb.syncQueue.put({
        ...currentQueue,
        serverId: input.serverId ?? currentQueue.serverId,
        baseUpdatedAt: input.baseUpdatedAt ?? currentQueue.baseUpdatedAt ?? current?.serverUpdatedAt,
        operation,
        payload: input.payload,
        nextAttemptAt: now,
        status: "pending",
        error: undefined,
      });
    } else {
      await offlineDb.syncQueue.put({
        operationId,
        localId,
        serverId: input.serverId,
        baseUpdatedAt: input.baseUpdatedAt ?? current?.serverUpdatedAt,
        farmId: input.farmId,
        entity: input.entity,
        operation,
        payload: input.payload,
        createdAt: now,
        attempts: 0,
        nextAttemptAt: now,
        status: "pending",
      });
    }
  });
  dispatch("kukudhamini-sync-change");
  dispatch("kukudhamini-offline-saved");
  return localId;
}

export async function getOfflineRecords(farmId: string, entity?: OfflineEntity) {
  ensureClient();
  const records = entity
    ? await offlineDb.records.where("[farmId+entity]").equals([farmId, entity]).toArray()
    : await offlineDb.records.where("farmId").equals(farmId).toArray();
  return records.filter((record) => !record.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getOfflineRecord(localId: string) {
  ensureClient();
  const record = await offlineDb.records.get(localId);
  return record?.deletedAt ? undefined : record;
}

export async function pendingSyncCount(farmId?: string) {
  ensureClient();
  const items = farmId ? await offlineDb.syncQueue.where("farmId").equals(farmId).toArray() : await offlineDb.syncQueue.toArray();
  return items.filter((item) => item.status !== "failed" || item.attempts > 0).length;
}

export async function probeServer() {
  ensureClient();
  if (!navigator.onLine) return false;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("/api/health", { cache: "no-store", signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function hydrateOfflineData(farmId: string) {
  ensureClient();
  const response = await fetch("/api/offline-data", { cache: "no-store" });
  if (!response.ok) throw new Error("Offline data download failed.");
  const payload = await response.json() as Record<string, unknown> & { syncedAt: string };
  const entityMap: Record<string, OfflineEntity> = {
    batches: "batch",
    expenses: "expense",
    feedTransactions: "feedTransaction",
    healthTasks: "healthTask",
    mortality: "mortality",
    notifications: "notification",
    sales: "sale",
    payments: "payment",
    feedProducts: "feedProduct",
    expenseCategories: "expenseCategory",
    suppliers: "supplier",
  };
  await offlineDb.transaction("rw", offlineDb.records, offlineDb.snapshots, offlineDb.appSettings, async () => {
    if (payload.farm) await offlineDb.appSettings.put({ key: `farm:${farmId}`, value: payload.farm, updatedAt: payload.syncedAt });
    for (const [key, entity] of Object.entries(entityMap)) {
      const records = Array.isArray(payload[key]) ? payload[key] as Array<Record<string, unknown>> : [];
      const offlineRecords = records.filter((record) => typeof record.id === "string").map((record) => ({ localId: `server-${entity}-${String(record.id)}`, serverId: String(record.id), farmId, entity, data: record, createdAt: String(record.createdAt ?? payload.syncedAt), updatedAt: String(record.updatedAt ?? payload.syncedAt), lastSyncedAt: payload.syncedAt, serverUpdatedAt: String(record.updatedAt ?? payload.syncedAt), syncStatus: "synced" as const }));
      await offlineDb.records.bulkPut(offlineRecords);
      await offlineDb.snapshots.put({ key: `${farmId}:${entity}`, farmId, entity, records: offlineRecords, syncedAt: payload.syncedAt });
    }
  });
  dispatch("kukudhamini-sync-change");
  return payload;
}

export async function syncPendingOperations() {
  ensureClient();
  if (!(await probeServer())) return { synced: 0, failed: 0, conflicts: 0, unavailable: true };
  const now = new Date().toISOString();
  const queue = (await offlineDb.syncQueue.toArray()).filter((item) => item.status !== "syncing" && item.nextAttemptAt <= now).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let synced = 0;
  let failed = 0;
  let conflicts = 0;

  for (const item of queue) {
    await offlineDb.syncQueue.update(item.operationId, { status: "syncing" });
    await offlineDb.records.update(item.localId, { syncStatus: "syncing" });
    try {
      const response = await fetch("/api/offline-sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...item, entityId: item.serverId ?? item.localId }),
      });
      const result = await response.json().catch(() => ({})) as SyncResponse & { error?: string; conflict?: Record<string, unknown> };
      if (response.status === 409 && result.conflict) {
        conflicts += 1;
        await offlineDb.transaction("rw", offlineDb.records, offlineDb.syncQueue, async () => {
          await offlineDb.records.update(item.localId, { syncStatus: "failed", conflict: { server: result.conflict ?? {}, detectedAt: new Date().toISOString() } });
          await offlineDb.syncQueue.update(item.operationId, { status: "failed", error: "Conflict detected." });
        });
        continue;
      }
      if (!response.ok) throw new Error(result.error ?? "Sync failed.");
      const syncedAt = result.syncedAt ?? new Date().toISOString();
      await offlineDb.transaction("rw", offlineDb.records, offlineDb.syncQueue, async () => {
        const record = await offlineDb.records.get(item.localId);
        if (record) await offlineDb.records.put({ ...record, serverId: result.serverId ?? record.serverId, syncStatus: "synced", lastSyncedAt: syncedAt, serverUpdatedAt: result.serverUpdatedAt ?? syncedAt, conflict: undefined });
        await offlineDb.syncQueue.delete(item.operationId);
      });
      synced += 1;
    } catch (error) {
      failed += 1;
      const attempts = item.attempts + 1;
      const delay = Math.min(RETRY_BASE_MS * 2 ** Math.min(attempts, 6), MAX_RETRY_MS);
      await offlineDb.transaction("rw", offlineDb.records, offlineDb.syncQueue, async () => {
        await offlineDb.syncQueue.update(item.operationId, { attempts, status: "failed", error: error instanceof Error ? error.message : "Sync failed.", nextAttemptAt: new Date(Date.now() + delay).toISOString() });
        await offlineDb.records.update(item.localId, { syncStatus: "failed" });
      });
    }
  }
  if (queue.length) dispatch("kukudhamini-sync-change");
  return { synced, failed, conflicts, unavailable: false };
}

export async function clearFarmOfflineData(farmId: string) {
  ensureClient();
  await offlineDb.transaction("rw", offlineDb.records, offlineDb.syncQueue, offlineDb.snapshots, async () => {
    await offlineDb.records.where("farmId").equals(farmId).delete();
    await offlineDb.syncQueue.where("farmId").equals(farmId).delete();
    await offlineDb.snapshots.where("farmId").equals(farmId).delete();
  });
  dispatch("kukudhamini-sync-change");
}

export async function cacheOfflineSnapshot(farmId: string, entity: OfflineEntity, records: OfflineRecord[]) {
  ensureClient();
  await offlineDb.snapshots.put({ key: `${farmId}:${entity}`, farmId, entity, records, syncedAt: new Date().toISOString() });
}
