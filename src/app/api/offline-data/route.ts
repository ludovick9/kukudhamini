import { NextResponse } from "next/server";
import { getAuthenticatedFarmContext } from "@/lib/auth";
import { getPrisma } from "@/server/db";
import { getBatches, getExpenses, getFeedTransactions, getHealthTasks, getMortality, getNotifications, getSales } from "@/services/farm-services";

export async function GET() {
  try {
    const { farm } = await getAuthenticatedFarmContext();
    const prisma = getPrisma();
    const [batches, expenses, feedTransactions, healthTasks, mortality, notifications, sales, payments, feedProducts, categories, suppliers] = await Promise.all([
      getBatches(farm.id),
      getExpenses(farm.id),
      getFeedTransactions(farm.id),
      getHealthTasks(farm.id),
      getMortality(farm.id),
      getNotifications(farm.id),
      getSales(farm.id),
      prisma.payment.findMany({ where: { farmId: farm.id }, orderBy: { paymentDate: "desc" }, take: 200 }),
      prisma.feedProduct.findMany({ where: { farmId: farm.id }, orderBy: { type: "asc" } }),
      prisma.expenseCategory.findMany({ where: { farmId: farm.id }, orderBy: { name: "asc" } }),
      prisma.supplier.findMany({ where: { farmId: farm.id }, orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({
      farm,
      batches: batches.slice(0, 100),
      expenses: expenses.slice(0, 200),
      feedTransactions: feedTransactions.slice(0, 200),
      healthTasks: healthTasks.slice(0, 200),
      mortality: mortality.slice(0, 200),
      notifications: notifications.slice(0, 100),
      sales: sales.slice(0, 200),
      payments: payments.slice(0, 200),
      feedProducts: feedProducts.slice(0, 100),
      expenseCategories: categories.slice(0, 100),
      suppliers: suppliers.slice(0, 100),
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Offline data could not be downloaded." }, { status: 500 });
  }
}