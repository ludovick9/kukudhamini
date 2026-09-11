-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FarmMembershipRole" AS ENUM ('OWNER', 'MANAGER', 'WORKER');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExpensePaymentMethod" AS ENUM ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'CREDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedType" AS ENUM ('STARTER', 'GROWER', 'FINISHER');

-- CreateEnum
CREATE TYPE "FeedTransactionType" AS ENUM ('PURCHASE', 'CONSUMPTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "HealthTaskType" AS ENUM ('MEDICINE', 'VACCINATION', 'OTHER');

-- CreateEnum
CREATE TYPE "HealthTaskStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'MISSED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "SalePricingMode" AS ENUM ('PER_KG', 'PER_BIRD');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('HEALTH', 'FEED', 'MORTALITY', 'HARVEST', 'FINANCE', 'FARM_TASK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "role" "FarmMembershipRole" NOT NULL DEFAULT 'WORKER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "arrivalDate" DATE NOT NULL,
    "initialBirdCount" INTEGER NOT NULL,
    "expectedHarvestDate" DATE NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "batchId" TEXT,
    "categoryId" TEXT NOT NULL,
    "supplierId" TEXT,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "paymentMethod" "ExpensePaymentMethod" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedProduct" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "type" "FeedType" NOT NULL,
    "name" TEXT NOT NULL,
    "lowStockThreshold" DECIMAL(12,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedTransaction" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "batchId" TEXT,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "type" "FeedTransactionType" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,2),
    "date" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthTask" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "batchId" TEXT,
    "title" TEXT NOT NULL,
    "type" "HealthTaskType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "instructions" TEXT,
    "status" "HealthTaskStatus" NOT NULL DEFAULT 'UPCOMING',
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MortalityRecord" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cause" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MortalityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "customerId" TEXT,
    "date" DATE NOT NULL,
    "birdsSold" INTEGER NOT NULL,
    "totalWeight" DECIMAL(12,3),
    "pricingMode" "SalePricingMode" NOT NULL,
    "pricePerKg" DECIMAL(14,2),
    "pricePerBird" DECIMAL(14,2),
    "totalRevenue" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "userId" TEXT,
    "relatedBatchId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "FarmMembership_farmId_idx" ON "FarmMembership"("farmId");

-- CreateIndex
CREATE INDEX "FarmMembership_userId_idx" ON "FarmMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmMembership_userId_farmId_key" ON "FarmMembership"("userId", "farmId");

-- CreateIndex
CREATE INDEX "Batch_farmId_idx" ON "Batch"("farmId");

-- CreateIndex
CREATE INDEX "Batch_farmId_status_idx" ON "Batch"("farmId", "status");

-- CreateIndex
CREATE INDEX "Batch_expectedHarvestDate_idx" ON "Batch"("expectedHarvestDate");

-- CreateIndex
CREATE INDEX "ExpenseCategory_farmId_idx" ON "ExpenseCategory"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_farmId_name_key" ON "ExpenseCategory"("farmId", "name");

-- CreateIndex
CREATE INDEX "Supplier_farmId_idx" ON "Supplier"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_farmId_name_key" ON "Supplier"("farmId", "name");

-- CreateIndex
CREATE INDEX "Expense_farmId_date_idx" ON "Expense"("farmId", "date");

-- CreateIndex
CREATE INDEX "Expense_batchId_idx" ON "Expense"("batchId");

-- CreateIndex
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- CreateIndex
CREATE INDEX "FeedProduct_farmId_idx" ON "FeedProduct"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedProduct_farmId_type_key" ON "FeedProduct"("farmId", "type");

-- CreateIndex
CREATE INDEX "FeedTransaction_farmId_date_idx" ON "FeedTransaction"("farmId", "date");

-- CreateIndex
CREATE INDEX "FeedTransaction_productId_idx" ON "FeedTransaction"("productId");

-- CreateIndex
CREATE INDEX "FeedTransaction_batchId_idx" ON "FeedTransaction"("batchId");

-- CreateIndex
CREATE INDEX "FeedTransaction_type_idx" ON "FeedTransaction"("type");

-- CreateIndex
CREATE INDEX "HealthTask_farmId_scheduledAt_idx" ON "HealthTask"("farmId", "scheduledAt");

-- CreateIndex
CREATE INDEX "HealthTask_batchId_idx" ON "HealthTask"("batchId");

-- CreateIndex
CREATE INDEX "HealthTask_status_idx" ON "HealthTask"("status");

-- CreateIndex
CREATE INDEX "HealthTask_type_idx" ON "HealthTask"("type");

-- CreateIndex
CREATE INDEX "MortalityRecord_farmId_date_idx" ON "MortalityRecord"("farmId", "date");

-- CreateIndex
CREATE INDEX "MortalityRecord_batchId_date_idx" ON "MortalityRecord"("batchId", "date");

-- CreateIndex
CREATE INDEX "Customer_farmId_idx" ON "Customer"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_farmId_name_key" ON "Customer"("farmId", "name");

-- CreateIndex
CREATE INDEX "Sale_farmId_date_idx" ON "Sale"("farmId", "date");

-- CreateIndex
CREATE INDEX "Sale_batchId_idx" ON "Sale"("batchId");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Notification_farmId_createdAt_idx" ON "Notification"("farmId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_relatedBatchId_idx" ON "Notification"("relatedBatchId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_priority_idx" ON "Notification"("priority");

-- AddForeignKey
ALTER TABLE "FarmMembership" ADD CONSTRAINT "FarmMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmMembership" ADD CONSTRAINT "FarmMembership_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedProduct" ADD CONSTRAINT "FeedProduct_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedTransaction" ADD CONSTRAINT "FeedTransaction_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedTransaction" ADD CONSTRAINT "FeedTransaction_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedTransaction" ADD CONSTRAINT "FeedTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FeedProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedTransaction" ADD CONSTRAINT "FeedTransaction_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTask" ADD CONSTRAINT "HealthTask_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthTask" ADD CONSTRAINT "HealthTask_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MortalityRecord" ADD CONSTRAINT "MortalityRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MortalityRecord" ADD CONSTRAINT "MortalityRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_relatedBatchId_fkey" FOREIGN KEY ("relatedBatchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
