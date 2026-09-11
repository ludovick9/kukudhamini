import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the development database.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const day = (value: string) => new Date(`${value}T00:00:00.000Z`);
const at = (value: string) => new Date(`${value}:00.000Z`);

async function main() {
  const user = await prisma.user.upsert({ where: { email: "demo@kukudhamini.local" }, update: {}, create: { name: "Demo Farm Manager", email: "demo@kukudhamini.local" } });
  const existingFarm = await prisma.farm.findFirst({ where: { name: "KukuDhamini Poultry Farm (DEMO)" } });
  if (existingFarm) {
    console.log("Development demo data already exists.");
    return;
  }
  const farm = await prisma.farm.create({ data: { name: "KukuDhamini Poultry Farm (DEMO)", location: "Morogoro, Tanzania", currency: "TZS", timezone: "Africa/Dar_es_Salaam" } });
  await prisma.farmMembership.create({ data: { userId: user.id, farmId: farm.id, role: "OWNER" } });

  const [batch1, batch2, batch3] = await Promise.all([
    prisma.batch.create({ data: { farmId: farm.id, name: "September Starter", breed: "Cobb 500", arrivalDate: day("2026-08-25"), initialBirdCount: 2040, expectedHarvestDate: day("2026-10-06"), status: "ACTIVE", notes: "Development demo data." } }),
    prisma.batch.create({ data: { farmId: farm.id, name: "August Growers", breed: "Ross 308", arrivalDate: day("2026-08-18"), initialBirdCount: 1532, expectedHarvestDate: day("2026-09-29"), status: "ACTIVE", notes: "Development demo data." } }),
    prisma.batch.create({ data: { farmId: farm.id, name: "September Growers", breed: "Cobb 500", arrivalDate: day("2026-09-01"), initialBirdCount: 1359, expectedHarvestDate: day("2026-10-13"), status: "ACTIVE", notes: "Development demo data." } }),
  ]);

  const categories = await Promise.all(["Chicks", "Feed", "Medicine", "Utilities", "Labour", "Transport", "Equipment"].map((name) => prisma.expenseCategory.create({ data: { farmId: farm.id, name } })));
  const category = Object.fromEntries(categories.map((item) => [item.name, item.id]));
  const supplier = await prisma.supplier.create({ data: { farmId: farm.id, name: "Mkulima Feeds", phone: "+255 700 000 001" } });
  const vetSupplier = await prisma.supplier.create({ data: { farmId: farm.id, name: "Afya Vet Supplies", phone: "+255 700 000 002" } });

  const products = await Promise.all([
    prisma.feedProduct.create({ data: { farmId: farm.id, type: "STARTER", name: "Kuku Starter", lowStockThreshold: 150 } }),
    prisma.feedProduct.create({ data: { farmId: farm.id, type: "GROWER", name: "Kuku Grower", lowStockThreshold: 250 } }),
    prisma.feedProduct.create({ data: { farmId: farm.id, type: "FINISHER", name: "Kuku Finisher", lowStockThreshold: 220 } }),
  ]);
  const product = Object.fromEntries(products.map((item) => [item.type, item.id]));

  await prisma.expense.createMany({ data: [
    { farmId: farm.id, batchId: batch2.id, categoryId: category.Feed, supplierId: supplier.id, date: day("2026-09-08"), description: "Grower feed delivery", quantity: 460, unit: "kg", unitPrice: 1695, totalAmount: 779700, paymentMethod: "MOBILE_MONEY", notes: "Development demo data." },
    { farmId: farm.id, batchId: batch3.id, categoryId: category.Chicks, date: day("2026-09-07"), description: "Day-old chicks", quantity: 1359, unit: "birds", unitPrice: 1192, totalAmount: 1620000, paymentMethod: "BANK_TRANSFER", notes: "Development demo data." },
    { farmId: farm.id, categoryId: category.Utilities, date: day("2026-09-06"), description: "Electricity and water", quantity: 1, unit: "month", unitPrice: 245000, totalAmount: 245000, paymentMethod: "CASH", notes: "Development demo data." },
    { farmId: farm.id, batchId: batch3.id, categoryId: category.Feed, supplierId: supplier.id, date: day("2026-09-05"), description: "Starter feed delivery", quantity: 500, unit: "kg", unitPrice: 1860, totalAmount: 930000, paymentMethod: "CASH", notes: "Development demo data." },
    { farmId: farm.id, categoryId: category.Medicine, supplierId: vetSupplier.id, date: day("2026-09-02"), description: "Health supplies", quantity: 1, unit: "lot", unitPrice: 315000, totalAmount: 315000, paymentMethod: "CASH", notes: "Development demo data." },
  ] });

  await prisma.feedTransaction.createMany({ data: [
    { farmId: farm.id, batchId: batch3.id, productId: product.STARTER, supplierId: supplier.id, type: "PURCHASE", quantity: 900, unit: "kg", unitPrice: 1850, date: day("2026-09-01"), notes: "Development demo data." },
    { farmId: farm.id, batchId: batch3.id, productId: product.STARTER, type: "CONSUMPTION", quantity: 780, unit: "kg", date: day("2026-09-08"), notes: "Development demo data." },
    { farmId: farm.id, batchId: batch2.id, productId: product.GROWER, supplierId: supplier.id, type: "PURCHASE", quantity: 920, unit: "kg", unitPrice: 1720, date: day("2026-08-20"), notes: "Development demo data." },
    { farmId: farm.id, batchId: batch2.id, productId: product.GROWER, type: "CONSUMPTION", quantity: 600, unit: "kg", date: day("2026-09-08"), notes: "Development demo data." },
    { farmId: farm.id, batchId: batch1.id, productId: product.FINISHER, supplierId: supplier.id, type: "PURCHASE", quantity: 700, unit: "kg", unitPrice: 1680, date: day("2026-08-25"), notes: "Development demo data." },
    { farmId: farm.id, batchId: batch1.id, productId: product.FINISHER, type: "CONSUMPTION", quantity: 520, unit: "kg", date: day("2026-09-08"), notes: "Development demo data." },
  ] });

  await prisma.healthTask.createMany({ data: [
    { farmId: farm.id, batchId: batch2.id, title: "Newcastle vaccination", type: "VACCINATION", scheduledAt: at("2026-09-07T09:00"), status: "MISSED", instructions: "Farmer-entered schedule. Confirm with a qualified veterinarian.", notes: "Development demo data." },
    { farmId: farm.id, batchId: batch3.id, title: "Health check", type: "OTHER", scheduledAt: at("2026-09-09T09:00"), status: "UPCOMING", instructions: "Review flock condition.", notes: "Development demo data." },
    { farmId: farm.id, batchId: batch1.id, title: "Vitamin supplement", type: "MEDICINE", scheduledAt: at("2026-09-08T08:15"), status: "COMPLETED", completedAt: at("2026-09-08T08:15"), instructions: "Farmer-entered instruction.", notes: "Development demo data." },
  ] });
  await prisma.mortalityRecord.createMany({ data: [
    { farmId: farm.id, batchId: batch2.id, date: day("2026-09-08"), quantity: 4, cause: "Unspecified", notes: "Development demo data." },
    { farmId: farm.id, batchId: batch1.id, date: day("2026-09-07"), quantity: 3, cause: "Unspecified", notes: "Development demo data." },
    { farmId: farm.id, batchId: batch3.id, date: day("2026-09-06"), quantity: 1, cause: "Unspecified", notes: "Development demo data." },
    { farmId: farm.id, batchId: batch2.id, date: day("2026-09-05"), quantity: 5, cause: "Unspecified", notes: "Development demo data." },
  ] });

  const customer = await prisma.customer.create({ data: { farmId: farm.id, name: "Mji Fresh Market", phone: "+255 700 000 003" } });
  await prisma.sale.create({ data: { farmId: farm.id, batchId: batch2.id, customerId: customer.id, date: day("2026-09-08"), birdsSold: 120, totalWeight: 228, pricingMode: "PER_KG", pricePerKg: 4000, totalRevenue: 912000, notes: "Development demo data." } });
  await prisma.notification.createMany({ data: [
    { farmId: farm.id, userId: user.id, relatedBatchId: batch2.id, type: "HEALTH", title: "Missed vaccination", message: "[[event:health-task:seed-newcastle:overdue]]Newcastle vaccination for BATCH-002 needs attention.", priority: "CRITICAL" },
    { farmId: farm.id, userId: user.id, type: "FEED", title: "Starter feed is low", message: "120 kg remaining, below the 150 kg threshold.", priority: "HIGH" },
    { farmId: farm.id, userId: user.id, relatedBatchId: batch3.id, type: "HEALTH", title: "Health task tomorrow", message: "Health check scheduled for BATCH-003.", priority: "MEDIUM" },
  ] });
}

main().then(async () => prisma.$disconnect()).catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });