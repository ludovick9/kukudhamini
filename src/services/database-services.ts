import { getPrisma } from "@/server/db";
import { requireFarmMutationAccess } from "@/lib/auth";
import { currentBirds, feedStock, paymentStatus } from "@/lib/domain-rules";
import { dateKeyInTimezone, formatTimestamp, safeTimezone } from "@/lib/timezone";
import type { Batch, BatchActivity, BatchDetails, Expense, ExpenseSummary, FeedStock, FeedSummary, FeedTransactionRecord, HealthSummary, HealthTask, HealthTaskDetails, MortalityRecord, Notification, Payment, PaymentSummary, ReportData, Sale, SalesSummary } from "@/domain/types";
import { batchInputSchema, batchStatusSchema, expenseInputSchema, feedProductInputSchema, feedTransactionInputSchema, healthTaskInputSchema, mortalityInputSchema, paymentInputSchema, saleInputSchema } from "@/lib/validation/database";

const batchStatus = { ACTIVE: "active", COMPLETED: "completed", ARCHIVED: "archived" } as const;
const feedType = { STARTER: "Starter", GROWER: "Grower", FINISHER: "Finisher" } as const;

function asDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function getDatabaseFarm(farmId: string) {
  const farm = await getPrisma().farm.findUniqueOrThrow({ where: { id: farmId } });
  return { id: farm.id, name: farm.name, location: farm.location, currency: farm.currency, timezone: farm.timezone };
}

export async function getDatabaseBatches(farmId: string): Promise<Batch[]> {
  const records = await getPrisma().batch.findMany({ where: { farmId }, include: { mortalityRecords: true, sales: true }, orderBy: { expectedHarvestDate: "asc" } });
  return records.map((batch) => { const mortality = batch.mortalityRecords.reduce((sum, record) => sum + record.quantity, 0); const sold = batch.sales.reduce((sum, sale) => sum + sale.birdsSold, 0); return { id: batch.id, code: batch.name.toUpperCase().replaceAll(" ", "-"), name: batch.name, breed: batch.breed, arrivalDate: asDate(batch.arrivalDate), ageDays: Math.max(0, Math.floor((Date.now() - batch.arrivalDate.getTime()) / 86400000)), initialBirds: batch.initialBirdCount, currentBirds: Math.max(0, batch.initialBirdCount - mortality - sold), mortality, mortalityRate: batch.initialBirdCount ? Number(((mortality / batch.initialBirdCount) * 100).toFixed(2)) : 0, harvestDate: asDate(batch.expectedHarvestDate), daysRemaining: Math.max(0, Math.ceil((batch.expectedHarvestDate.getTime() - Date.now()) / 86400000)), status: batchStatus[batch.status] }; });
}

export async function getDatabaseExpenses(farmId: string): Promise<Expense[]> {
  const records = await getPrisma().expense.findMany({ where: { farmId }, include: { category: true, supplier: true, batch: true }, orderBy: { date: "desc" } });
  return records.map((expense) => ({ id: expense.id, date: asDate(expense.date), category: expense.category.name as Expense["category"], description: expense.description, amount: Number(expense.totalAmount), supplier: expense.supplier?.name ?? "", batchCode: expense.batch?.name.toUpperCase().replaceAll(" ", "-"), quantity: Number(expense.quantity), unit: expense.unit, unitPrice: Number(expense.unitPrice), paymentMethod: expense.paymentMethod, notes: expense.notes ?? undefined, createdAt: expense.createdAt.toISOString() }));
}

export async function getDatabaseExpenseOptions(farmId: string) {
  const prisma = getPrisma();
  const [categories, suppliers, batches] = await Promise.all([prisma.expenseCategory.findMany({ where: { farmId }, orderBy: { name: "asc" } }), prisma.supplier.findMany({ where: { farmId }, orderBy: { name: "asc" } }), prisma.batch.findMany({ where: { farmId }, orderBy: { arrivalDate: "desc" } })]);
  return { categories, suppliers, batches };
}

export async function getDatabaseExpenseSummary(farmId: string): Promise<ExpenseSummary> {
  const prisma = getPrisma();
  const [expenses, farm] = await Promise.all([prisma.expense.findMany({ where: { farmId }, include: { category: true } }), prisma.farm.findUnique({ where: { id: farmId }, select: { timezone: true } })]);
  const timezone = safeTimezone(farm?.timezone); const now = new Date(); const monthKey = dateKeyInTimezone(now, timezone).slice(0, 7); const today = dateKeyInTimezone(now, timezone);
  const total = expenses.reduce((sum, expense) => sum + Number(expense.totalAmount), 0);
  const thisMonth = expenses.filter((expense) => asDate(expense.date).slice(0, 7) === monthKey).reduce((sum, expense) => sum + Number(expense.totalAmount), 0);
  const todayTotal = expenses.filter((expense) => asDate(expense.date) === today).reduce((sum, expense) => sum + Number(expense.totalAmount), 0);
  const categoryMap = new Map<string, number>(); expenses.forEach((expense) => categoryMap.set(expense.category.name, (categoryMap.get(expense.category.name) ?? 0) + Number(expense.totalAmount)));
  return { total, thisMonth, today: todayTotal, count: expenses.length, byCategory: Array.from(categoryMap, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value) };
}

export async function getDatabaseFeedStock(farmId: string): Promise<FeedStock[]> {
  const products = await getPrisma().feedProduct.findMany({ where: { farmId }, include: { transactions: true }, orderBy: { type: "asc" } });
  return products.map((product) => { const purchasedKg = product.transactions.filter((item) => item.type === "PURCHASE").reduce((sum, item) => sum + Number(item.quantity), 0); const consumedKg = product.transactions.filter((item) => item.type === "CONSUMPTION").reduce((sum, item) => sum + Number(item.quantity), 0); const adjustments = product.transactions.filter((item) => item.type === "ADJUSTMENT").reduce((sum, item) => sum + Number(item.quantity), 0); return { id: product.id, type: feedType[product.type], productName: product.name, remainingKg: feedStock(purchasedKg, consumedKg, adjustments), purchasedKg, consumedKg, thresholdKg: Number(product.lowStockThreshold), unitCost: Number(product.transactions.find((item) => item.unitPrice)?.unitPrice ?? 0) }; });
}

export async function getDatabaseFeedTransactions(farmId: string): Promise<FeedTransactionRecord[]> {
  const records = await getPrisma().feedTransaction.findMany({ where: { farmId }, include: { product: true, supplier: true, batch: true }, orderBy: { date: "desc" } });
  return records.map((item) => ({ id: item.id, date: asDate(item.date), productId: item.productId, productName: item.product.name, type: item.type, quantity: Number(item.quantity), unit: item.unit, unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined, supplier: item.supplier?.name, batchCode: item.batch?.name.toUpperCase().replaceAll(" ", "-"), notes: item.notes ?? undefined }));
}

export async function getDatabaseFeedSummary(farmId: string): Promise<FeedSummary> {
  const [stock, transactions] = await Promise.all([getDatabaseFeedStock(farmId), getDatabaseFeedTransactions(farmId)]);
  return { totalRemainingKg: stock.reduce((sum, item) => sum + item.remainingKg, 0), lowStockCount: stock.filter((item) => item.remainingKg <= item.thresholdKg).length, transactions };
}

export async function createDatabaseExpense(farmId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = expenseInputSchema.parse({ ...(input as object), farmId });
  const prisma = getPrisma();
  const [category, supplier, batch] = await Promise.all([
    prisma.expenseCategory.findFirst({ where: { id: data.categoryId, farmId }, select: { id: true } }),
    data.supplierId ? prisma.supplier.findFirst({ where: { id: data.supplierId, farmId }, select: { id: true } }) : null,
    data.batchId ? prisma.batch.findFirst({ where: { id: data.batchId, farmId }, select: { id: true } }) : null,
  ]);
  if (!category) throw new Error("Expense category was not found for this farm.");
  if (data.supplierId && !supplier) throw new Error("Supplier was not found for this farm.");
  if (data.batchId && !batch) throw new Error("Batch was not found for this farm.");
  return prisma.expense.create({ data: { ...data, totalAmount: data.totalAmount } });
}

export async function updateDatabaseExpense(farmId: string, expenseId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = expenseInputSchema.parse({ ...(input as object), farmId });
  const prisma = getPrisma();
  const existing = await prisma.expense.findFirst({ where: { id: expenseId, farmId } });
  if (!existing) throw new Error("Expense not found.");
  const [category, supplier, batch] = await Promise.all([
    prisma.expenseCategory.findFirst({ where: { id: data.categoryId, farmId }, select: { id: true } }),
    data.supplierId ? prisma.supplier.findFirst({ where: { id: data.supplierId, farmId }, select: { id: true } }) : null,
    data.batchId ? prisma.batch.findFirst({ where: { id: data.batchId, farmId }, select: { id: true } }) : null,
  ]);
  if (!category) throw new Error("Expense category was not found for this farm.");
  if (data.supplierId && !supplier) throw new Error("Supplier was not found for this farm.");
  if (data.batchId && !batch) throw new Error("Batch was not found for this farm.");
  return prisma.expense.update({ where: { id: expenseId }, data: { ...data, totalAmount: data.totalAmount } });
}

export async function createDatabaseFeedProduct(farmId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = feedProductInputSchema.parse({ ...(input as object), farmId });
  return getPrisma().feedProduct.create({ data });
}

export async function createDatabaseFeedTransaction(farmId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = feedTransactionInputSchema.parse({ ...(input as object), farmId });
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const product = await tx.feedProduct.findFirst({ where: { id: data.productId, farmId }, include: { transactions: true } });
    if (!product) throw new Error("Feed product was not found for this farm.");
    if (data.supplierId) { const supplier = await tx.supplier.findFirst({ where: { id: data.supplierId, farmId }, select: { id: true } }); if (!supplier) throw new Error("Supplier was not found for this farm."); }
    if (data.batchId) { const batch = await tx.batch.findFirst({ where: { id: data.batchId, farmId }, select: { id: true } }); if (!batch) throw new Error("Batch was not found for this farm."); }
    if (data.type === "CONSUMPTION") {
      const stock = product.transactions.reduce((total, item) => total + (item.type === "CONSUMPTION" ? -Number(item.quantity) : Number(item.quantity)), 0);
      if (stock < data.quantity) throw new Error("Insufficient feed stock for this consumption record.");
    }
    return tx.feedTransaction.create({ data });
  });
}

export async function getDatabaseHealthTasks(farmId: string): Promise<HealthTask[]> {
  const prisma = getPrisma();
  const [records, farm] = await Promise.all([prisma.healthTask.findMany({ where: { farmId }, include: { batch: true }, orderBy: { scheduledAt: "asc" } }), prisma.farm.findUnique({ where: { id: farmId }, select: { timezone: true } })]);
  return records.map((task) => mapHealthTask(task, farm?.timezone));
}

function mapHealthTask(task: { id: string; title: string; type: "MEDICINE" | "VACCINATION" | "OTHER"; batchId: string | null; scheduledAt: Date; instructions: string | null; status: "UPCOMING" | "COMPLETED" | "MISSED" | "OVERDUE"; completedAt: Date | null; notes: string | null; createdAt: Date; batch?: { name: string } | null }, timezone?: string): HealthTask {
  const derivedStatus = task.completedAt || task.status === "COMPLETED" ? "completed" : task.scheduledAt.getTime() < Date.now() ? "overdue" : "upcoming";
  return { id: task.id, name: task.title, type: task.type === "VACCINATION" ? "Vaccine" : task.type === "MEDICINE" ? "Medicine" : "Other health task", batchId: task.batchId ?? undefined, batchCode: task.batch?.name.toUpperCase().replaceAll(" ", "-") ?? "Farm task", scheduledDate: asDate(task.scheduledAt), scheduledAt: task.scheduledAt.toISOString(), relativeDate: formatTimestamp(task.scheduledAt, timezone), status: derivedStatus, instructions: task.instructions ?? undefined, notes: task.notes ?? undefined, completedAt: task.completedAt?.toISOString(), createdAt: task.createdAt.toISOString() };
}

export async function getDatabaseHealthSummary(farmId: string): Promise<HealthSummary> {
  const tasks = await getDatabaseHealthTasks(farmId);
  return { total: tasks.length, pending: tasks.filter((task) => task.status === "upcoming").length, completed: tasks.filter((task) => task.status === "completed").length, overdue: tasks.filter((task) => task.status === "overdue" || task.status === "missed").length, vaccinations: tasks.filter((task) => task.type === "Vaccine").length, treatments: tasks.filter((task) => task.type === "Medicine" || task.type === "Other health task").length };
}

export async function createDatabaseHealthTask(farmId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = healthTaskInputSchema.parse({ ...(input as object), farmId });
  if (data.batchId) {
    const batch = await getPrisma().batch.findFirst({ where: { id: data.batchId, farmId }, select: { id: true } });
    if (!batch) throw new Error("Selected batch was not found for this farm.");
  }
  return getPrisma().healthTask.create({ data: { farmId, batchId: data.batchId, title: data.title, type: data.type, scheduledAt: data.scheduledAt, instructions: data.instructions, status: data.status, notes: data.notes } });
}

export async function updateDatabaseHealthTask(farmId: string, taskId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = healthTaskInputSchema.parse({ ...(input as object), farmId });
  const existing = await getPrisma().healthTask.findFirst({ where: { id: taskId, farmId } });
  if (!existing) throw new Error("Health task not found.");
  if (data.batchId) { const batch = await getPrisma().batch.findFirst({ where: { id: data.batchId, farmId }, select: { id: true } }); if (!batch) throw new Error("Selected batch was not found for this farm."); }
  return getPrisma().healthTask.update({ where: { id: taskId }, data: { batchId: data.batchId, title: data.title, type: data.type, scheduledAt: data.scheduledAt, instructions: data.instructions, status: data.status, notes: data.notes, completedAt: data.status === "COMPLETED" ? existing.completedAt ?? new Date() : null } });
}

export async function completeDatabaseHealthTask(farmId: string, taskId: string) {
  await requireFarmMutationAccess(farmId);
  const existing = await getPrisma().healthTask.findFirst({ where: { id: taskId, farmId } });
  if (!existing) throw new Error("Health task not found.");
  if (existing.status === "COMPLETED" || existing.completedAt) throw new Error("This health task is already completed.");
  return getPrisma().healthTask.update({ where: { id: taskId }, data: { status: "COMPLETED", completedAt: new Date() } });
}

export async function getDatabaseBatchHealthHistory(farmId: string, batchId: string): Promise<HealthTaskDetails[]> {
  const prisma = getPrisma();
  const [records, farm] = await Promise.all([prisma.healthTask.findMany({ where: { farmId, batchId }, include: { batch: true }, orderBy: { scheduledAt: "desc" } }), prisma.farm.findUnique({ where: { id: farmId }, select: { timezone: true } })]);
  return records.map((task) => ({ ...mapHealthTask(task, farm?.timezone), activityLabel: task.completedAt ? "Completed health task" : "Scheduled health task" }));
}

export async function getDatabaseMortality(farmId: string): Promise<MortalityRecord[]> {
  const records = await getPrisma().mortalityRecord.findMany({ where: { farmId }, include: { batch: true }, orderBy: { date: "desc" } });
  return records.map((record) => ({ id: record.id, date: asDate(record.date), batchCode: record.batch.name.toUpperCase().replaceAll(" ", "-"), deaths: record.quantity, cause: record.cause ?? "Unspecified" }));
}

export async function getDatabaseSales(farmId: string): Promise<Sale[]> {
  const records = await getPrisma().sale.findMany({ where: { farmId }, include: { batch: true, customer: true, payments: true }, orderBy: { date: "desc" } });
  return records.map((sale) => { const paidAmount = sale.payments.reduce((sum, payment) => sum + Number(payment.amount), 0); const balanceDue = Math.max(0, Number(sale.totalRevenue) - paidAmount); return { id: sale.id, date: asDate(sale.date), batchCode: sale.batch.name.toUpperCase().replaceAll(" ", "-"), birds: sale.birdsSold, totalWeightKg: Number(sale.totalWeight ?? 0), revenue: Number(sale.totalRevenue), buyer: sale.customer?.name ?? "Direct sale", pricingMode: sale.pricingMode, pricePerKg: sale.pricePerKg ? Number(sale.pricePerKg) : undefined, pricePerBird: sale.pricePerBird ? Number(sale.pricePerBird) : undefined, notes: sale.notes ?? undefined, createdAt: sale.createdAt.toISOString(), paidAmount, balanceDue, paymentStatus: paymentStatus(Number(sale.totalRevenue), paidAmount) }; });
}

export async function getDatabasePayments(saleId: string, farmId: string): Promise<Payment[]> {
  const records = await getPrisma().payment.findMany({ where: { saleId, farmId }, orderBy: { paymentDate: "desc" } });
  return records.map((payment) => ({ id: payment.id, saleId: payment.saleId, amount: Number(payment.amount), paymentMethod: payment.paymentMethod, paymentDate: asDate(payment.paymentDate), reference: payment.reference ?? undefined, notes: payment.notes ?? undefined, createdAt: payment.createdAt.toISOString() }));
}

export async function getDatabasePaymentSummary(farmId: string): Promise<PaymentSummary> {
  const sales = await getDatabaseSales(farmId); const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0); const totalPaid = sales.reduce((sum, sale) => sum + (sale.paidAmount ?? 0), 0); return { totalRevenue, totalPaid, totalOutstanding: totalRevenue - totalPaid, paidSales: sales.filter((sale) => sale.paymentStatus === "PAID").length, partialSales: sales.filter((sale) => sale.paymentStatus === "PARTIAL").length, unpaidSales: sales.filter((sale) => sale.paymentStatus === "UNPAID").length };
}

export async function createDatabasePayment(farmId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = paymentInputSchema.parse(input); const prisma = getPrisma();
  return prisma.$transaction(async (tx) => { const sale = await tx.sale.findFirst({ where: { id: data.saleId, farmId }, include: { payments: true } }); if (!sale) throw new Error("Sale was not found for this farm."); const paid = sale.payments.reduce((sum, payment) => sum + Number(payment.amount), 0); const outstanding = Number(sale.totalRevenue) - paid; if (data.amount > outstanding) throw new Error(`Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}.`); return tx.payment.create({ data: { farmId, saleId: data.saleId, amount: data.amount, paymentMethod: data.paymentMethod, paymentDate: data.paymentDate, reference: data.reference, notes: data.notes } }); }, { isolationLevel: "Serializable" });
}

export async function getDatabaseSaleOptions(farmId: string) {
  const prisma = getPrisma();
  const [customers, batches] = await Promise.all([prisma.customer.findMany({ where: { farmId }, orderBy: { name: "asc" } }), getDatabaseBatches(farmId)]);
  return { customers, batches };
}

export async function getDatabaseSalesSummary(farmId: string): Promise<SalesSummary> {
  const [sales, expenses] = await Promise.all([getDatabaseSales(farmId), getDatabaseExpenses(farmId)]);
  const farm = await getPrisma().farm.findUnique({ where: { id: farmId }, select: { timezone: true } });
  const monthKey = dateKeyInTimezone(new Date(), farm?.timezone).slice(0, 7);
  const thisMonth = sales.filter((sale) => sale.date.slice(0, 7) === monthKey).reduce((sum, sale) => sum + sale.revenue, 0);
  const directExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const revenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
  return { revenue, birdsSold: sales.reduce((sum, sale) => sum + sale.birds, 0), saleCount: sales.length, thisMonth, directExpenses, estimatedProfit: revenue - directExpenses };
}

export async function createDatabaseSale(farmId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = saleInputSchema.parse({ ...(input as object), farmId });
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findFirst({ where: { id: data.batchId, farmId }, include: { mortalityRecords: true, sales: true } });
    if (!batch) throw new Error("Selected batch was not found for this farm.");
    if (data.customerId) { const customer = await tx.customer.findFirst({ where: { id: data.customerId, farmId } }); if (!customer) throw new Error("Selected customer was not found for this farm."); }
    const mortality = batch.mortalityRecords.reduce((sum, record) => sum + record.quantity, 0);
    const sold = batch.sales.reduce((sum, sale) => sum + sale.birdsSold, 0);
    const available = batch.initialBirdCount - mortality - sold;
    if (data.birdsSold > available) throw new Error(`Only ${available.toLocaleString()} birds are currently available in this batch.`);
    const totalRevenue = data.pricingMode === "PER_KG" ? (data.totalWeight ?? 0) * (data.pricePerKg ?? 0) : data.birdsSold * (data.pricePerBird ?? 0);
    return tx.sale.create({ data: { farmId, batchId: data.batchId, customerId: data.customerId, date: data.date, birdsSold: data.birdsSold, totalWeight: data.totalWeight, pricingMode: data.pricingMode, pricePerKg: data.pricePerKg, pricePerBird: data.pricePerBird, totalRevenue, notes: data.notes } });
  }, { isolationLevel: "Serializable" });
}

export async function getDatabaseNotifications(farmId: string): Promise<Notification[]> {
  const prisma = getPrisma();
  const [records, farm] = await Promise.all([prisma.notification.findMany({ where: { farmId }, include: { relatedBatch: true }, orderBy: { createdAt: "desc" } }), prisma.farm.findUnique({ where: { id: farmId }, select: { timezone: true } })]);
  return records.map((notification) => { const eventKey = notification.message.match(/^\[\[event:([^\]]+)\]\]/)?.[1] ?? ""; const cleanMessage = notification.message.replace(/^\[\[event:[^\]]+\]\]\s*/, ""); const status = notification.type === "FEED" ? "warning" : eventKey.endsWith(":overdue") ? "missed" : notification.readAt ? "completed" : "upcoming"; return { id: notification.id, type: notification.type === "FEED" ? "feed" : notification.type === "HARVEST" ? "harvest" : notification.type === "MORTALITY" ? "mortality" : "health", title: notification.title, message: cleanMessage, time: formatTimestamp(notification.createdAt, farm?.timezone), priority: notification.priority.toLowerCase() as Notification["priority"], read: Boolean(notification.readAt), status, batchCode: notification.relatedBatch?.name.toUpperCase().replaceAll(" ", "-") }; });
}

const notificationEventMarker = (eventKey: string) => `[[event:${eventKey}]]`;

export async function generateDatabaseHealthNotifications(farmId: string) {
  const prisma = getPrisma();
  const farm = await prisma.farm.findUnique({ where: { id: farmId }, select: { timezone: true } });
  await prisma.$transaction(async (tx) => {
    const tasks = await tx.healthTask.findMany({ where: { farmId }, include: { batch: true } });
    const existing = await tx.notification.findMany({ where: { farmId, type: "HEALTH" } });
    const existingKeys = new Set(existing.map((item) => item.message.match(/^\[\[event:([^\]]+)\]\]/)?.[1]).filter(Boolean));
    const completedKeys = new Set<string>();
    for (const task of tasks) {
      const batchCode = task.batch?.name.toUpperCase().replaceAll(" ", "-") ?? "farm";
      const taskLabel = task.type === "VACCINATION" ? "Vaccination" : task.type === "MEDICINE" ? "Medication" : "Health task";
      const overdue = !task.completedAt && task.scheduledAt.getTime() < Date.now();
      const eventKind = overdue ? "overdue" : "upcoming";
      const eventKey = `health-task:${task.id}:${eventKind}`;
      if (task.completedAt) { completedKeys.add(`health-task:${task.id}:overdue`); completedKeys.add(`health-task:${task.id}:upcoming`); }
      if (task.completedAt || (!overdue && task.scheduledAt.getTime() - Date.now() > 48 * 60 * 60 * 1000 || existingKeys.has(eventKey))) continue;
      await tx.notification.create({ data: { farmId, relatedBatchId: task.batchId ?? undefined, type: "HEALTH", title: overdue ? `${taskLabel} overdue` : `${taskLabel} due soon`, message: `${notificationEventMarker(eventKey)}${task.title} for ${batchCode} · scheduled ${task.scheduledAt.toLocaleDateString("en-TZ", { timeZone: safeTimezone(farm?.timezone), day: "numeric", month: "short" })}`, priority: overdue ? "HIGH" : "MEDIUM" } });
    }
    if (completedKeys.size) { const completedNotifications = existing.filter((item) => { const key = item.message.match(/^\[\[event:([^\]]+)\]\]/)?.[1]; return key ? completedKeys.has(key) && !item.readAt : false; }); if (completedNotifications.length) await tx.notification.updateMany({ where: { id: { in: completedNotifications.map((item) => item.id) }, farmId }, data: { readAt: new Date() } }); }
  }, { isolationLevel: "Serializable" });
}

export async function getDatabaseUnreadNotificationCount(farmId: string) {
  return getPrisma().notification.count({ where: { farmId, readAt: null } });
}

export async function markDatabaseNotificationRead(farmId: string, notificationId: string) {
  const result = await getPrisma().notification.updateMany({ where: { id: notificationId, farmId, readAt: null }, data: { readAt: new Date() } });
  if (!result.count) throw new Error("Notification not found or already read.");
}

export async function markAllDatabaseNotificationsRead(farmId: string) {
  await getPrisma().notification.updateMany({ where: { farmId, readAt: null }, data: { readAt: new Date() } });
}

export async function getDatabaseBatchDetails(farmId: string, batchId: string): Promise<BatchDetails | null> {
  const batch = await getPrisma().batch.findFirst({ where: { id: batchId, farmId }, include: { mortalityRecords: { orderBy: { date: "desc" } }, sales: { orderBy: { date: "desc" } }, expenses: true } });
  if (!batch) return null;
  const mortality = batch.mortalityRecords.reduce((sum, record) => sum + record.quantity, 0);
  const birdsSold = batch.sales.reduce((sum, sale) => sum + sale.birdsSold, 0);
  const revenue = batch.sales.reduce((sum, sale) => sum + Number(sale.totalRevenue), 0);
  const directExpenses = batch.expenses.reduce((sum, expense) => sum + Number(expense.totalAmount), 0);
  const activity: BatchActivity[] = [
    { id: `${batch.id}-created`, title: "Batch created", detail: `${batch.initialBirdCount.toLocaleString()} birds arrived`, date: asDate(batch.createdAt), type: "created" as const },
    ...batch.mortalityRecords.map((record) => ({ id: record.id, title: "Mortality recorded", detail: `${record.quantity} birds · ${record.cause ?? "Unspecified"}`, date: asDate(record.date), type: "mortality" as const })),
    ...batch.sales.map((sale) => ({ id: sale.id, title: "Birds sold", detail: `${sale.birdsSold} birds sold`, date: asDate(sale.date), type: "sale" as const })),
  ].sort((left, right) => right.date.localeCompare(left.date));
  const mapped = batch as unknown as Batch;
  const initialBirds = batch.initialBirdCount;
  const remainingBirds = currentBirds(initialBirds, mortality, birdsSold);
  return {
    id: mapped.id,
    code: batch.name.toUpperCase().replaceAll(" ", "-"),
    name: batch.name,
    breed: batch.breed,
    arrivalDate: asDate(batch.arrivalDate),
    ageDays: Math.max(0, Math.floor((Date.now() - batch.arrivalDate.getTime()) / 86400000)),
    initialBirds,
    currentBirds: remainingBirds,
    mortality,
    mortalityRate: initialBirds ? Number(((mortality / initialBirds) * 100).toFixed(2)) : 0,
    harvestDate: asDate(batch.expectedHarvestDate),
    daysRemaining: Math.ceil((batch.expectedHarvestDate.getTime() - Date.now()) / 86400000),
    status: batch.status.toLowerCase() as Batch["status"],
    birdsSold,
    survivalRate: initialBirds ? Number((((initialBirds - mortality) / initialBirds) * 100).toFixed(2)) : 0,
    soldPercentage: initialBirds ? Number(((birdsSold / initialBirds) * 100).toFixed(2)) : 0,
    revenue,
    directExpenses,
    directProfit: revenue - directExpenses,
    notes: batch.notes ?? undefined,
    activity,
  };
}

export async function createDatabaseBatch(farmId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = batchInputSchema.parse(input);
  return getPrisma().batch.create({ data: { farmId, ...data } });
}

export async function updateDatabaseBatch(farmId: string, batchId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = batchInputSchema.parse(input);
  const existing = await getPrisma().batch.findFirst({ where: { id: batchId, farmId }, include: { mortalityRecords: true, sales: true } });
  if (!existing) throw new Error("Batch not found.");
  const updateData = { name: data.name, breed: data.breed, arrivalDate: data.arrivalDate, expectedHarvestDate: data.expectedHarvestDate, status: data.status, notes: data.notes };
  return getPrisma().batch.update({ where: { id: batchId }, data: updateData });
}

export async function updateDatabaseBatchStatus(farmId: string, batchId: string, status: unknown) {
  await requireFarmMutationAccess(farmId);
  const parsedStatus = batchStatusSchema.parse(status);
  const existing = await getPrisma().batch.findFirst({ where: { id: batchId, farmId } });
  if (!existing) throw new Error("Batch not found.");
  return getPrisma().batch.update({ where: { id: batchId }, data: { status: parsedStatus } });
}

export async function getDatabaseReportData(farmId: string, start: Date, end: Date): Promise<ReportData> {
  const prisma = getPrisma(); const endExclusive = new Date(end.getTime() + 86400000);
  const [sales, expenses, payments, batches, feedTransactions] = await Promise.all([
    prisma.sale.findMany({ where: { farmId, date: { gte: start, lt: endExclusive } }, include: { batch: true, payments: true } }),
    prisma.expense.findMany({ where: { farmId, date: { gte: start, lt: endExclusive } }, include: { category: true, batch: true } }),
    prisma.payment.findMany({ where: { farmId, sale: { date: { gte: start, lt: endExclusive } } } }),
    prisma.batch.findMany({ where: { farmId }, include: { mortalityRecords: true, sales: { where: { date: { gte: start, lt: endExclusive } }, include: { payments: true } }, expenses: { where: { date: { gte: start, lt: endExclusive } } } } }),
    prisma.feedTransaction.findMany({ where: { farmId, date: { gte: start, lt: endExclusive } }, include: { product: true } }),
  ]);
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.totalRevenue), 0); const expensesTotal = expenses.reduce((sum, expense) => sum + Number(expense.totalAmount), 0); const cashReceived = payments.reduce((sum, payment) => sum + Number(payment.amount), 0); const outstanding = Math.max(0, revenue - cashReceived); const profit = revenue - expensesTotal;
  const byCategory = new Map<string, number>(); expenses.forEach((expense) => byCategory.set(expense.category.name, (byCategory.get(expense.category.name) ?? 0) + Number(expense.totalAmount))); const categoryRows = Array.from(byCategory, ([label, amount]) => ({ label, amount, percentage: expensesTotal ? Number(((amount / expensesTotal) * 100).toFixed(1)) : 0 })).sort((a, b) => b.amount - a.amount);
  const methodMap = new Map<string, { count: number; amount: number }>(); payments.forEach((payment) => { const item = methodMap.get(payment.paymentMethod) ?? { count: 0, amount: 0 }; item.count += 1; item.amount += Number(payment.amount); methodMap.set(payment.paymentMethod, item); });
  const feedMap = new Map<string, { purchasedKg: number; consumedKg: number; cost: number }>(); feedTransactions.forEach((item) => { const current = feedMap.get(item.product.type) ?? { purchasedKg: 0, consumedKg: 0, cost: 0 }; if (item.type === "PURCHASE") { current.purchasedKg += Number(item.quantity); current.cost += Number(item.quantity) * Number(item.unitPrice ?? 0); } if (item.type === "CONSUMPTION") current.consumedKg += Number(item.quantity); feedMap.set(item.product.type, current); });
  const batchRows = batches.map((batch) => { const mortality = batch.mortalityRecords.reduce((sum, record) => sum + record.quantity, 0); const birdsSold = batch.sales.reduce((sum, sale) => sum + sale.birdsSold, 0); const batchRevenue = batch.sales.reduce((sum, sale) => sum + Number(sale.totalRevenue), 0); const paid = batch.sales.reduce((sum, sale) => sum + sale.payments.reduce((inner, payment) => inner + Number(payment.amount), 0), 0); const batchExpenses = batch.expenses.reduce((sum, expense) => sum + Number(expense.totalAmount), 0); return { id: batch.id, name: batch.name, status: batch.status, initialBirds: batch.initialBirdCount, currentBirds: Math.max(0, batch.initialBirdCount - mortality - birdsSold), mortality, mortalityRate: batch.initialBirdCount ? Number(((mortality / batch.initialBirdCount) * 100).toFixed(2)) : 0, birdsSold, revenue: batchRevenue, paid, outstanding: Math.max(0, batchRevenue - paid), expenses: batchExpenses, profit: batchRevenue - batchExpenses, margin: batchRevenue ? Number((((batchRevenue - batchExpenses) / batchRevenue) * 100).toFixed(1)) : 0 }; });
  const initialBirds = batchRows.reduce((sum, batch) => sum + batch.initialBirds, 0); const totalMortality = batchRows.reduce((sum, batch) => sum + batch.mortality, 0); const birdsSold = batchRows.reduce((sum, batch) => sum + batch.birdsSold, 0); const stock = await getDatabaseFeedStock(farmId); const activeBatchRows = batchRows.filter((batch) => batch.status === "ACTIVE");
  const dayMap = new Map<string, { revenue: number; expenses: number; cash: number }>(); sales.forEach((sale) => { const key = asDate(sale.date); const item = dayMap.get(key) ?? { revenue: 0, expenses: 0, cash: 0 }; item.revenue += Number(sale.totalRevenue); dayMap.set(key, item); }); expenses.forEach((expense) => { const key = asDate(expense.date); const item = dayMap.get(key) ?? { revenue: 0, expenses: 0, cash: 0 }; item.expenses += Number(expense.totalAmount); dayMap.set(key, item); }); payments.forEach((payment) => { const key = asDate(payment.paymentDate); const item = dayMap.get(key) ?? { revenue: 0, expenses: 0, cash: 0 }; item.cash += Number(payment.amount); dayMap.set(key, item); });
  return { range: { start: asDate(start), end: asDate(end) }, financial: { revenue, cashReceived, outstanding, expenses: expensesTotal, profit, margin: revenue ? Number(((profit / revenue) * 100).toFixed(1)) : 0 }, sales: { count: sales.length, birdsSold: sales.reduce((sum, sale) => sum + sale.birdsSold, 0), averageSale: sales.length ? revenue / sales.length : 0, averagePricePerBird: birdsSold ? revenue / birdsSold : 0, averagePricePerKg: sales.filter((sale) => sale.totalWeight).length ? sales.filter((sale) => sale.totalWeight).reduce((sum, sale) => sum + Number(sale.totalRevenue), 0) / sales.filter((sale) => sale.totalWeight).reduce((sum, sale) => sum + Number(sale.totalWeight), 0) : 0, paid: sales.filter((sale) => sale.payments.reduce((sum, payment) => sum + Number(payment.amount), 0) >= Number(sale.totalRevenue)).length, partial: sales.filter((sale) => { const paid = sale.payments.reduce((sum, payment) => sum + Number(payment.amount), 0); return paid > 0 && paid < Number(sale.totalRevenue); }).length, unpaid: sales.filter((sale) => sale.payments.length === 0).length }, paymentsByMethod: Array.from(methodMap, ([label, value]) => ({ label, ...value })), expenses: { count: expenses.length, average: expenses.length ? expensesTotal / expenses.length : 0, largest: expenses.reduce((max, expense) => Math.max(max, Number(expense.totalAmount)), 0), byCategory: categoryRows }, feed: { purchasedKg: feedTransactions.filter((item) => item.type === "PURCHASE").reduce((sum, item) => sum + Number(item.quantity), 0), consumedKg: feedTransactions.filter((item) => item.type === "CONSUMPTION").reduce((sum, item) => sum + Number(item.quantity), 0), cost: Array.from(feedMap.values()).reduce((sum, item) => sum + item.cost, 0), stockKg: stock.reduce((sum, item) => sum + item.remainingKg, 0), byType: Array.from(feedMap, ([label, value]) => ({ label, ...value })) }, batches: batchRows, operations: { mortality: totalMortality, initialBirds, mortalityRate: initialBirds ? Number(((totalMortality / initialBirds) * 100).toFixed(2)) : 0, birdsSold, salesRate: initialBirds ? Number(((birdsSold / initialBirds) * 100).toFixed(2)) : 0, remainingBirds: activeBatchRows.reduce((sum, batch) => sum + batch.currentBirds, 0), activeBatches: activeBatchRows.length, completedBatches: batchRows.filter((batch) => batch.status === "COMPLETED").length }, revenueTrend: Array.from(dayMap, ([label, value]) => ({ label, ...value })).sort((a, b) => a.label.localeCompare(b.label)) };
}

export async function createDatabaseMortality(farmId: string, input: unknown) {
  await requireFarmMutationAccess(farmId);
  const data = mortalityInputSchema.parse({ ...(input as object), farmId });
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const batch = await tx.batch.findFirst({ where: { id: data.batchId, farmId }, include: { mortalityRecords: true, sales: true } });
    if (!batch) throw new Error("Selected batch was not found for this farm.");
    const mortality = batch.mortalityRecords.reduce((sum, record) => sum + record.quantity, 0);
    const sold = batch.sales.reduce((sum, sale) => sum + sale.birdsSold, 0);
    const available = batch.initialBirdCount - mortality - sold;
    if (data.quantity > available) throw new Error(`Only ${Math.max(0, available).toLocaleString()} birds are currently available in this batch.`);
    return tx.mortalityRecord.create({ data: { farmId, batchId: data.batchId, date: data.date, quantity: data.quantity, cause: data.cause, notes: data.notes } });
  }, { isolationLevel: "Serializable" });
}