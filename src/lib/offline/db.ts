import Dexie, { type Table } from "dexie";

export type OfflineEntity =
  | "batch"
  | "expense"
  | "feedProduct"
  | "feedTransaction"
  | "healthTask"
  | "mortality"
  | "sale"
  | "payment"
  | "notification"
  | "customer"
  | "supplier"
  | "expenseCategory";
export type OfflineMutation = "create" | "update" | "delete";
export type SyncStatus = "pending" | "syncing" | "failed" | "synced";

export type OfflineRecord = {
  localId: string;
  serverId?: string;
  farmId: string;
  entity: OfflineEntity;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
  serverUpdatedAt?: string;
  deletedAt?: string;
  conflict?: {
    server: Record<string, unknown>;
    detectedAt: string;
  };
  syncStatus: SyncStatus;
};

export type SyncQueueItem = {
  operationId: string;
  localId: string;
  serverId?: string;
  baseUpdatedAt?: string;
  farmId: string;
  entity: OfflineEntity;
  operation: OfflineMutation;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  nextAttemptAt: string;
  status: "pending" | "syncing" | "failed";
  error?: string;
};

export type OfflineSnapshot = {
  key: string;
  farmId: string;
  entity: OfflineEntity;
  records: OfflineRecord[];
  syncedAt: string;
};

class KukuDhaminiOfflineDatabase extends Dexie {
  records!: Table<OfflineRecord, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  snapshots!: Table<OfflineSnapshot, string>;
  appSettings!: Table<{ key: string; value: unknown; updatedAt: string }, string>;

  constructor() {
    super("kukudhamini-offline");
    this.version(1).stores({
      records: "localId, [farmId+entity], farmId, syncStatus, updatedAt",
      syncQueue: "operationId, [farmId+nextAttemptAt], farmId, localId, createdAt",
      snapshots: "key, [farmId+entity], farmId, syncedAt",
      appSettings: "key, updatedAt",
    });
    this.version(2).stores({
      records: "localId, [farmId+entity], [farmId+entity+updatedAt], farmId, syncStatus, updatedAt",
      syncQueue: "operationId, [farmId+nextAttemptAt], [farmId+status], farmId, localId, createdAt, status",
      snapshots: "key, [farmId+entity], farmId, syncedAt",
      appSettings: "key, updatedAt",
    });
  }
}

export const offlineDb = new KukuDhaminiOfflineDatabase();

export function createLocalId() {
  return `local-${crypto.randomUUID()}`;
}

export function createOperationId() {
  return crypto.randomUUID();
}

export function createLocalRecordId() {
  return `local-${crypto.randomUUID()}`;
}