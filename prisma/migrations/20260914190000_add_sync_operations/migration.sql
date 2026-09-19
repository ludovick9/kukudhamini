CREATE TABLE "SyncOperation" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SyncOperation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SyncOperation_operationId_key" ON "SyncOperation"("operationId");
CREATE INDEX "SyncOperation_farmId_createdAt_idx" ON "SyncOperation"("farmId", "createdAt");
CREATE INDEX "SyncOperation_farmId_entity_entityId_idx" ON "SyncOperation"("farmId", "entity", "entityId");
ALTER TABLE "SyncOperation" ADD CONSTRAINT "SyncOperation_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;