import { getPrisma, isDatabaseConfigured } from "@/server/db";
import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { completeDatabaseHealthTask, createDatabaseBatch, createDatabaseExpense, createDatabaseFeedProduct, createDatabaseFeedTransaction, createDatabaseHealthTask, createDatabaseMortality, createDatabasePayment, createDatabaseSale, deleteDatabaseBatch, deleteDatabaseExpense, deleteDatabaseFeedTransaction, deleteDatabaseHealthTask, deleteDatabaseMortality, deleteDatabaseSale, generateDatabaseHealthNotifications, getDatabaseBatchDetails, getDatabaseBatchHealthHistory, getDatabaseBatches, getDatabaseExpenseOptions, getDatabaseExpenseSummary, getDatabaseExpenses, getDatabaseFeedStock, getDatabaseFeedSummary, getDatabaseFeedTransactions, getDatabaseHealthSummary, getDatabaseHealthTasks, getDatabaseMortality, getDatabaseNotifications, getDatabasePaymentSummary, getDatabasePayments, getDatabaseReportData, getDatabaseSaleOptions, getDatabaseSales, getDatabaseSalesSummary, getDatabaseUnreadNotificationCount, markAllDatabaseNotificationsRead, markDatabaseNotificationRead, updateDatabaseBatch, updateDatabaseBatchStatus, updateDatabaseExpense, updateDatabaseFeedTransaction, updateDatabaseHealthTask, updateDatabaseMortality, updateDatabaseSale } from "@/services/database-services";
import { getDashboardData as getMockDashboardData, getFarmContext as getMockFarmContext, getBatches as getMockBatches, getExpenses as getMockExpenses, getFeedStock as getMockFeedStock, getHealthTasks as getMockHealthTasks, getMortality as getMockMortality, getNotifications as getMockNotifications, getSales as getMockSales } from "@/services/mock-services";
import type { BatchDetails, DashboardData, PaymentSummary, ReportData, SaleDetails } from "@/domain/types";
import { dateKeyInTimezone } from "@/lib/timezone";
import { logger } from "@/server/logger";

export function usingDatabase() {
  return isDatabaseConfigured();
}

export async function getFarmContext() {
  if (!usingDatabase()) {
    if (process.env.NODE_ENV === "development") return getMockFarmContext();
    throw new Error("The database is not configured.");
  }

  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const membership = await getPrisma().farmMembership.findFirst({
    where: { userId: session.userId },
    include: { farm: true, user: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    redirect("/login");
  }

  const unreadNotificationCount = await getDatabaseUnreadNotificationCount(membership.farm.id);
  return {
    farm: { id: membership.farm.id, name: membership.farm.name, location: membership.farm.location, currency: membership.farm.currency, timezone: membership.farm.timezone, unreadNotificationCount },
    user: { id: membership.user.id, name: membership.user.name, email: membership.user.email, role: membership.role, initials: membership.user.name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U" },
  };
}

export async function getBatches(farmId: string) {
  return usingDatabase() ? getDatabaseBatches(farmId) : getMockBatches();
}

export async function getExpenses(farmId: string) {
  return usingDatabase() ? getDatabaseExpenses(farmId) : getMockExpenses();
}

export async function getFeedStock(farmId: string) {
  return usingDatabase() ? getDatabaseFeedStock(farmId) : getMockFeedStock();
}

export async function getHealthTasks(farmId: string) {
  return usingDatabase() ? getDatabaseHealthTasks(farmId) : getMockHealthTasks();
}

export async function getHealthSummary(farmId: string) {
  return usingDatabase() ? getDatabaseHealthSummary(farmId) : { total: 0, pending: 0, completed: 0, overdue: 0, vaccinations: 0, treatments: 0 };
}

export async function getBatchHealthHistory(farmId: string, batchId: string) {
  return usingDatabase() ? getDatabaseBatchHealthHistory(farmId, batchId) : [];
}

export async function createHealthTask(farmId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Health task creation requires a configured database.");
  return createDatabaseHealthTask(farmId, input);
}

export async function updateHealthTask(farmId: string, taskId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Health task editing requires a configured database.");
  return updateDatabaseHealthTask(farmId, taskId, input);
}

export async function deleteHealthTask(farmId: string, taskId: string) {
  if (!usingDatabase()) throw new Error("Health task deletion requires a configured database.");
  return deleteDatabaseHealthTask(farmId, taskId);
}

export async function completeHealthTask(farmId: string, taskId: string) {
  if (!usingDatabase()) throw new Error("Health task completion requires a configured database.");
  return completeDatabaseHealthTask(farmId, taskId);
}

export async function getMortality(farmId: string) {
  return usingDatabase() ? getDatabaseMortality(farmId) : getMockMortality();
}

export async function createMortality(farmId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Mortality recording requires a configured database.");
  return createDatabaseMortality(farmId, input);
}

export async function updateMortality(farmId: string, mortalityId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Mortality editing requires a configured database.");
  return updateDatabaseMortality(farmId, mortalityId, input);
}

export async function deleteMortality(farmId: string, mortalityId: string) {
  if (!usingDatabase()) throw new Error("Mortality deletion requires a configured database.");
  return deleteDatabaseMortality(farmId, mortalityId);
}

export async function getSales(farmId: string) {
  return usingDatabase() ? getDatabaseSales(farmId) : getMockSales();
}

export async function getSaleOptions(farmId: string) { return usingDatabase() ? getDatabaseSaleOptions(farmId) : { customers: [], batches: await getBatches(farmId) }; }
export async function getSalesSummary(farmId: string) { return usingDatabase() ? getDatabaseSalesSummary(farmId) : { revenue: 0, birdsSold: 0, saleCount: 0, thisMonth: 0, directExpenses: 0, estimatedProfit: 0 }; }
export async function getPaymentSummary(farmId: string): Promise<PaymentSummary> { return usingDatabase() ? getDatabasePaymentSummary(farmId) : { totalRevenue: 0, totalPaid: 0, totalOutstanding: 0, paidSales: 0, partialSales: 0, unpaidSales: 0 }; }
export async function getReportData(farmId: string, start: Date, end: Date): Promise<ReportData> { if (!usingDatabase()) throw new Error("Reports require a configured database."); return getDatabaseReportData(farmId, start, end); }
export async function getSalePayments(farmId: string, saleId: string) { return usingDatabase() ? getDatabasePayments(saleId, farmId) : []; }
export async function createPayment(farmId: string, input: unknown) { if (!usingDatabase()) throw new Error("Payments require a configured database."); return createDatabasePayment(farmId, input); }
export async function getSaleDetails(farmId: string, saleId: string): Promise<SaleDetails | null> { const sale = (await getSales(farmId)).find((item) => item.id === saleId); if (!sale) return null; return { ...sale, payments: await getSalePayments(farmId, saleId) }; }
export async function createSale(farmId: string, input: unknown) { if (!usingDatabase()) throw new Error("Sales require a configured database."); return createDatabaseSale(farmId, input); }
export async function updateSale(farmId: string, saleId: string, input: unknown) { if (!usingDatabase()) throw new Error("Sales editing requires a configured database."); return updateDatabaseSale(farmId, saleId, input); }
export async function deleteSale(farmId: string, saleId: string) { if (!usingDatabase()) throw new Error("Sales deletion requires a configured database."); return deleteDatabaseSale(farmId, saleId); }

export async function getNotifications(farmId: string) {
  return usingDatabase() ? getDatabaseNotifications(farmId) : getMockNotifications();
}

export async function generateHealthNotifications(farmId: string) { if (usingDatabase()) await generateDatabaseHealthNotifications(farmId); }
export async function getUnreadNotificationCount(farmId: string) { return usingDatabase() ? getDatabaseUnreadNotificationCount(farmId) : getMockNotifications().filter((item) => !item.read).length; }
export async function markNotificationRead(farmId: string, notificationId: string) { if (!usingDatabase()) throw new Error("Notifications require a configured database."); return markDatabaseNotificationRead(farmId, notificationId); }
export async function markAllNotificationsRead(farmId: string) { if (!usingDatabase()) throw new Error("Notifications require a configured database."); return markAllDatabaseNotificationsRead(farmId); }

export async function getDashboardData(farmId: string): Promise<DashboardData> {
  if (!usingDatabase()) return getMockDashboardData();
  const farm = await getPrisma().farm.findUnique({ where: { id: farmId }, select: { timezone: true } });
  const [batches, expenses, feedStock, healthTasks, mortality, sales, notifications, feedTransactions] = await Promise.all([getBatches(farmId), getExpenses(farmId), getFeedStock(farmId), getHealthTasks(farmId), getMortality(farmId), getSales(farmId), getNotifications(farmId), getFeedTransactions(farmId)]);
  const demo = getMockDashboardData();
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
  const activeBatches = batches.filter((batch) => batch.status === "active");
  const activeBatchCodes = new Set(activeBatches.map((batch) => batch.code));
  const activeMortality = mortality.filter((record) => activeBatchCodes.has(record.batchCode));
  const totalDeaths = activeMortality.reduce((sum, record) => sum + record.deaths, 0);
  const totalInitial = activeBatches.reduce((sum, batch) => sum + batch.initialBirds, 0);
  const expensesByCategory = new Map<string, number>(); expenses.forEach((expense) => expensesByCategory.set(expense.category, (expensesByCategory.get(expense.category) ?? 0) + expense.amount));
  const dayMap = new Map<string, { expenses: number; revenue: number; cash: number }>(); expenses.forEach((expense) => { const item = dayMap.get(expense.date) ?? { expenses: 0, revenue: 0, cash: 0 }; item.expenses += expense.amount; dayMap.set(expense.date, item); }); sales.forEach((sale) => { const item = dayMap.get(sale.date) ?? { expenses: 0, revenue: 0, cash: 0 }; item.revenue += sale.revenue; item.cash += sale.paidAmount ?? 0; dayMap.set(sale.date, item); });
  const mortalityMap = new Map<string, number>(); mortality.forEach((record) => mortalityMap.set(record.date, (mortalityMap.get(record.date) ?? 0) + record.deaths));
  const feedMap = new Map<string, number>(); feedTransactions.filter((item) => item.type === "CONSUMPTION").forEach((item) => feedMap.set(item.date, (feedMap.get(item.date) ?? 0) + item.quantity));
  const liveCharts = { expensesOverTime: Array.from(dayMap, ([label, value]) => ({ label, expenses: value.expenses })), expensesByCategory: Array.from(expensesByCategory, ([label, value]) => ({ label, value })), feedConsumption: Array.from(feedMap, ([label, value]) => ({ label, feed: value })), mortalityTrend: Array.from(mortalityMap, ([label, value]) => ({ label, mortality: value })), revenueVsExpenses: Array.from(dayMap, ([label, value]) => ({ label, revenue: value.revenue, expenses: value.expenses })), profitTrend: Array.from(dayMap, ([label, value]) => ({ label, profit: value.revenue - value.expenses })) };
  const today = dateKeyInTimezone(new Date(), farm?.timezone);
  return { ...demo, ...liveCharts, stats: { ...demo.stats, activeBirds: activeBatches.reduce((sum, batch) => sum + batch.currentBirds, 0), activeBatches: activeBatches.length, expenses: totalExpenses, feedRemainingKg: feedStock.reduce((sum, feed) => sum + feed.remainingKg, 0), mortality: totalDeaths, mortalityRate: totalInitial ? Number(((totalDeaths / totalInitial) * 100).toFixed(2)) : 0, revenue: totalRevenue, estimatedProfit: totalRevenue - totalExpenses, deathsToday: activeMortality.filter((record) => record.date === today).reduce((sum, record) => sum + record.deaths, 0), deathsThisWeek: totalDeaths }, batches, feedStock, healthTasks, notifications };
}

export async function getBatchDetails(farmId: string, batchId: string) {
  if (usingDatabase()) return getDatabaseBatchDetails(farmId, batchId);
  const batch = (await getBatches(farmId)).find((item) => item.id === batchId);
  if (!batch) return null;
  const details: BatchDetails = { ...batch, birdsSold: 0, survivalRate: batch.initialBirds ? Number((((batch.initialBirds - batch.mortality) / batch.initialBirds) * 100).toFixed(2)) : 0, soldPercentage: 0, revenue: 0, directExpenses: 0, directProfit: 0, activity: [] };
  return details;
}

export async function createBatch(farmId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Batch creation requires a configured database.");
  return createDatabaseBatch(farmId, input);
}

export async function updateBatch(farmId: string, batchId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Batch editing requires a configured database.");
  return updateDatabaseBatch(farmId, batchId, input);
}

export async function updateBatchStatus(farmId: string, batchId: string, status: unknown) {
  if (!usingDatabase()) throw new Error("Batch status changes require a configured database.");
  return updateDatabaseBatchStatus(farmId, batchId, status);
}
export async function deleteBatch(farmId: string, batchId: string) {
  if (!usingDatabase()) {
    throw new Error("Batch deletion requires a configured database.");
  }

  return deleteDatabaseBatch(farmId, batchId);
}

export async function getExpenseOptions(farmId: string) {
  if (!usingDatabase()) {
    if (process.env.NODE_ENV === "development") logger.warn("Database unavailable for expense options", { operation: "getExpenseOptions" });
    return { categories: [], suppliers: [], batches: await getMockBatches() };
  }
  const options = await getDatabaseExpenseOptions(farmId);
  return { ...options, batches: await getBatches(farmId) };
}

export async function getExpenseSummary(farmId: string) {
  if (!usingDatabase()) { const expenses = getMockExpenses(); return { total: expenses.reduce((sum, item) => sum + item.amount, 0), thisMonth: expenses.reduce((sum, item) => sum + item.amount, 0), today: expenses.filter((item) => item.date === "2026-09-08").reduce((sum, item) => sum + item.amount, 0), count: expenses.length, byCategory: [] }; }
  return getDatabaseExpenseSummary(farmId);
}

export async function updateExpense(farmId: string, expenseId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Expense editing requires a configured database.");
  return updateDatabaseExpense(farmId, expenseId, input);
}

export async function deleteExpense(farmId: string, expenseId: string) {
  if (!usingDatabase()) throw new Error("Expense deletion requires a configured database.");
  return deleteDatabaseExpense(farmId, expenseId);
}

export async function createExpense(farmId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Expense creation requires a configured database.");
  return createDatabaseExpense(farmId, input);
}

export async function getFeedTransactions(farmId: string) {
  return usingDatabase() ? getDatabaseFeedTransactions(farmId) : [];
}

export async function getFeedSummary(farmId: string) {
  if (!usingDatabase()) { const stock = getMockFeedStock(); return { totalRemainingKg: stock.reduce((sum, item) => sum + item.remainingKg, 0), lowStockCount: stock.filter((item) => item.remainingKg <= item.thresholdKg).length, transactions: [] }; }
  return getDatabaseFeedSummary(farmId);
}

export async function getFeedOptions(farmId: string) {
  if (!usingDatabase()) {
    if (process.env.NODE_ENV === "development") logger.warn("Database unavailable for feed options", { operation: "getFeedOptions" });
    return { products: [], suppliers: [], batches: await getMockBatches() };
  }
  const prisma = getPrisma();
  const [products, suppliers, batches] = await Promise.all([prisma.feedProduct.findMany({ where: { farmId }, orderBy: { type: "asc" } }), prisma.supplier.findMany({ where: { farmId }, orderBy: { name: "asc" } }), getBatches(farmId)]);
  if (process.env.NODE_ENV === "development" && products.length === 0) logger.warn("No feed products found", { operation: "getFeedOptions", farmId });
  return { products, suppliers, batches };
}

export async function createFeedProduct(farmId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Feed product creation requires a configured database.");
  return createDatabaseFeedProduct(farmId, input);
}

export async function createFeedTransaction(farmId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Feed transaction creation requires a configured database.");
  return createDatabaseFeedTransaction(farmId, input);
}

export async function updateFeedTransaction(farmId: string, transactionId: string, input: unknown) {
  if (!usingDatabase()) throw new Error("Feed transaction editing requires a configured database.");
  return updateDatabaseFeedTransaction(farmId, transactionId, input);
}

export async function deleteFeedTransaction(farmId: string, transactionId: string) {
  if (!usingDatabase()) throw new Error("Feed transaction deletion requires a configured database.");
  return deleteDatabaseFeedTransaction(farmId, transactionId);
}