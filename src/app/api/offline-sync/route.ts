import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getAuthenticatedFarmContext } from "@/lib/auth";
import { getPrisma } from "@/server/db";
import {
  createDatabaseBatch,
  createDatabaseExpense,
  createDatabaseFeedProduct,
  createDatabaseFeedTransaction,
  createDatabaseHealthTask,
  createDatabaseMortality,
  createDatabasePayment,
  createDatabaseSale,
  deleteDatabaseBatch,
  deleteDatabaseExpense,
  deleteDatabaseFeedTransaction,
  deleteDatabaseHealthTask,
  deleteDatabaseMortality,
  deleteDatabaseSale,
  updateDatabaseBatch,
  updateDatabaseExpense,
  updateDatabaseFeedTransaction,
  updateDatabaseHealthTask,
  updateDatabaseMortality,
  updateDatabaseSale,
} from "@/services/database-services";

const supportedEntities = new Set([
  "batch",
  "expense",
  "feedProduct",
  "feedTransaction",
  "healthTask",
  "mortality",
  "sale",
  "payment",
]);

type SyncRequest = {
  operationId?: string;
  farmId?: string;
  entity?: string;
  operation?: "create" | "update" | "delete";
  entityId?: string;
  payload?: Record<string, unknown>;
  baseUpdatedAt?: string;
};

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

async function findServerRecord(entity: string, entityId: string, farmId: string) {
  const prisma = getPrisma();
  if (entity === "batch") return prisma.batch.findFirst({ where: { id: entityId, farmId } });
  if (entity === "expense") return prisma.expense.findFirst({ where: { id: entityId, farmId } });
  if (entity === "feedTransaction") return prisma.feedTransaction.findFirst({ where: { id: entityId, farmId } });
  if (entity === "healthTask") return prisma.healthTask.findFirst({ where: { id: entityId, farmId } });
  if (entity === "mortality") return prisma.mortalityRecord.findFirst({ where: { id: entityId, farmId } });
  if (entity === "sale") return prisma.sale.findFirst({ where: { id: entityId, farmId } });
  if (entity === "payment") return prisma.payment.findFirst({ where: { id: entityId, farmId } });
  return null;
}

async function applyOperation(farmId: string, body: Required<Pick<SyncRequest, "entity" | "operation" | "entityId">> & SyncRequest) {
  const payload = body.payload ?? {};
  if (body.entity === "batch") {
    if (body.operation === "create") return createDatabaseBatch(farmId, payload);
    if (body.operation === "update") return updateDatabaseBatch(farmId, body.entityId, payload);
    return deleteDatabaseBatch(farmId, body.entityId);
  }
  if (body.entity === "expense") {
    if (body.operation === "create") return createDatabaseExpense(farmId, payload);
    if (body.operation === "update") return updateDatabaseExpense(farmId, body.entityId, payload);
    return deleteDatabaseExpense(farmId, body.entityId);
  }
  if (body.entity === "feedProduct") {
    if (body.operation !== "create") throw new Error("Feed products can only be created through offline sync.");
    return createDatabaseFeedProduct(farmId, payload);
  }
  if (body.entity === "feedTransaction") {
    if (body.operation === "create") return createDatabaseFeedTransaction(farmId, payload);
    if (body.operation === "update") return updateDatabaseFeedTransaction(farmId, body.entityId, payload);
    return deleteDatabaseFeedTransaction(farmId, body.entityId);
  }
  if (body.entity === "healthTask") {
    if (body.operation === "create") return createDatabaseHealthTask(farmId, payload);
    if (body.operation === "update") return updateDatabaseHealthTask(farmId, body.entityId, payload);
    return deleteDatabaseHealthTask(farmId, body.entityId);
  }
  if (body.entity === "mortality") {
    if (body.operation === "create") return createDatabaseMortality(farmId, payload);
    if (body.operation === "update") return updateDatabaseMortality(farmId, body.entityId, payload);
    return deleteDatabaseMortality(farmId, body.entityId);
  }
  if (body.entity === "sale") {
    if (body.operation === "create") return createDatabaseSale(farmId, payload);
    if (body.operation === "update") return updateDatabaseSale(farmId, body.entityId, payload);
    return deleteDatabaseSale(farmId, body.entityId);
  }
  if (body.entity === "payment" && body.operation === "create") return createDatabasePayment(farmId, payload);
  throw new Error("Unsupported offline operation.");
}

export async function POST(request: Request) {
  try {
    const { farm } = await getAuthenticatedFarmContext();
    const body = await request.json() as SyncRequest;
    if (!body.operationId || body.farmId !== farm.id || !body.entity || !supportedEntities.has(body.entity) || !body.operation || !["create", "update", "delete"].includes(body.operation) || !body.entityId || (body.operation !== "delete" && !body.payload)) {
      return NextResponse.json({ error: "Invalid offline operation." }, { status: 400 });
    }

    const prisma = getPrisma();
    const existingOperation = await prisma.syncOperation.findUnique({ where: { operationId: body.operationId } });
    if (existingOperation) {
      return NextResponse.json({ serverId: existingOperation.entityId, syncedAt: existingOperation.completedAt?.toISOString() ?? existingOperation.createdAt.toISOString() });
    }

    if (body.operation === "update" && body.baseUpdatedAt) {
      const serverRecord = await findServerRecord(body.entity, body.entityId, farm.id) as { updatedAt?: Date } | null;
      if (serverRecord?.updatedAt && serverRecord.updatedAt.toISOString() !== body.baseUpdatedAt) {
        return NextResponse.json({ error: "Conflict detected.", conflict: serverRecord }, { status: 409 });
      }
    }

    const result = await applyOperation(farm.id, body as Required<Pick<SyncRequest, "entity" | "operation" | "entityId">> & SyncRequest) as { id?: string; updatedAt?: Date };
    const serverId = result.id ?? body.entityId;
    const syncedAt = new Date();
    try {
      await prisma.syncOperation.create({ data: { operationId: body.operationId, farmId: farm.id, entity: body.entity, entityId: serverId, operation: body.operation, payload: (body.payload ?? {}) as Prisma.InputJsonValue, completedAt: syncedAt } });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const duplicate = await prisma.syncOperation.findUnique({ where: { operationId: body.operationId } });
      return NextResponse.json({ serverId: duplicate?.entityId ?? serverId, syncedAt: duplicate?.completedAt?.toISOString() ?? syncedAt.toISOString() });
    }
    return NextResponse.json({ serverId, syncedAt: syncedAt.toISOString(), serverUpdatedAt: result.updatedAt?.toISOString() ?? syncedAt.toISOString() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Offline synchronization failed." }, { status: 500 });
  }
}