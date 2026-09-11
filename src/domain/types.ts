export type BatchStatus = "active" | "completed" | "archived";
export type ExpenseCategory =
  | "Chicks"
  | "Feed"
  | "Medicine"
  | "Utilities"
  | "Labour"
  | "Transport"
  | "Equipment";
export type FeedType = "Starter" | "Grower" | "Finisher";
export type HealthTaskType = "Vaccine" | "Medicine" | "Other health task";
export type HealthTaskStatus = "upcoming" | "completed" | "missed" | "overdue";
export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
  initials: string;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  currency: string;
  timezone: string;
  unreadNotificationCount?: number;
}

export interface Batch {
  id: string;
  code: string;
  name: string;
  breed: string;
  arrivalDate: string;
  ageDays: number;
  initialBirds: number;
  currentBirds: number;
  mortality: number;
  mortalityRate: number;
  harvestDate: string;
  daysRemaining: number;
  status: BatchStatus;
}

export interface BatchDetails extends Batch {
  birdsSold: number;
  survivalRate: number;
  soldPercentage: number;
  revenue: number;
  directExpenses: number;
  directProfit: number;
  notes?: string;
  activity: BatchActivity[];
}

export interface BatchActivity {
  id: string;
  title: string;
  detail: string;
  date: string;
  type: "created" | "mortality" | "sale" | "status";
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  supplier: string;
  batchCode?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  paymentMethod?: string;
  notes?: string;
  createdAt?: string;
}

export interface FeedStock {
  id: string;
  type: FeedType;
  remainingKg: number;
  purchasedKg: number;
  consumedKg: number;
  thresholdKg: number;
  unitCost: number;
  productName?: string;
}

export interface FeedTransactionRecord {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: "PURCHASE" | "CONSUMPTION" | "ADJUSTMENT";
  quantity: number;
  unit: string;
  unitPrice?: number;
  supplier?: string;
  batchCode?: string;
  notes?: string;
}

export interface ExpenseSummary {
  total: number;
  thisMonth: number;
  today: number;
  count: number;
  byCategory: Array<{ label: string; value: number }>;
}

export interface FeedSummary {
  totalRemainingKg: number;
  lowStockCount: number;
  transactions: FeedTransactionRecord[];
}

export interface HealthTask {
  id: string;
  name: string;
  type: HealthTaskType;
  batchCode: string;
  batchId?: string;
  scheduledDate: string;
  scheduledAt?: string;
  relativeDate: string;
  status: HealthTaskStatus;
  instructions?: string;
  notes?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface HealthTaskDetails extends HealthTask {
  activityLabel: string;
}

export interface HealthSummary {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  vaccinations: number;
  treatments: number;
}

export interface MortalityRecord {
  id: string;
  date: string;
  batchCode: string;
  deaths: number;
  cause: string;
}

export interface Sale {
  id: string;
  date: string;
  batchCode: string;
  birds: number;
  totalWeightKg: number;
  revenue: number;
  buyer: string;
  pricingMode?: "PER_KG" | "PER_BIRD";
  pricePerKg?: number;
  pricePerBird?: number;
  notes?: string;
  createdAt?: string;
  paidAmount?: number;
  balanceDue?: number;
  paymentStatus?: "UNPAID" | "PARTIAL" | "PAID";
}

export interface Payment {
  id: string;
  saleId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
  createdAt?: string;
}

export interface PaymentSummary {
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  paidSales: number;
  partialSales: number;
  unpaidSales: number;
}

export interface SalesSummary {
  revenue: number;
  birdsSold: number;
  saleCount: number;
  thisMonth: number;
  directExpenses: number;
  estimatedProfit: number;
}

export interface Notification {
  id: string;
  type: "health" | "feed" | "mortality" | "harvest";
  title: string;
  message: string;
  time: string;
  priority: NotificationPriority;
  read: boolean;
  status: HealthTaskStatus | "warning";
  batchCode?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "feed" | "mortality" | "health" | "expense" | "sale" | "batch";
}

export interface TodayTask {
  id: string;
  title: string;
  detail: string;
  dueLabel: string;
  type: "health" | "feed" | "mortality" | "harvest" | "finance";
  priority: "urgent" | "attention" | "ready";
  status: "open" | "scheduled" | "monitoring";
  actionLabel: string;
  relatedCode?: string;
}

export interface ChartPoint {
  label: string;
  value?: number;
  expenses?: number;
  revenue?: number;
  feed?: number;
  mortality?: number;
  profit?: number;
}

export interface DashboardData {
  stats: {
    activeBirds: number;
    activeBatches: number;
    expenses: number;
    feedRemainingKg: number;
    mortality: number;
    mortalityRate: number;
    deathsToday: number;
    deathsThisWeek: number;
    revenue: number;
    estimatedProfit: number;
    changes: {
      activeBirds: string;
      expenses: string;
      mortality: string;
      revenue: string;
      estimatedProfit: string;
    };
  };
  expensesOverTime: ChartPoint[];
  expensesByCategory: ChartPoint[];
  feedConsumption: ChartPoint[];
  mortalityTrend: ChartPoint[];
  revenueVsExpenses: ChartPoint[];
  profitTrend: ChartPoint[];
  batches: Batch[];
  feedStock: FeedStock[];
  healthTasks: HealthTask[];
  activities: Activity[];
  todayTasks: TodayTask[];
  notifications: Notification[];
}

export interface SaleDetails extends Sale {
  payments: Payment[];
}

export interface ReportData {
  range: { start: string; end: string };
  financial: { revenue: number; cashReceived: number; outstanding: number; expenses: number; profit: number; margin: number };
  sales: { count: number; birdsSold: number; averageSale: number; averagePricePerBird: number; averagePricePerKg: number; paid: number; partial: number; unpaid: number };
  paymentsByMethod: Array<{ label: string; count: number; amount: number }>;
  expenses: { count: number; average: number; largest: number; byCategory: Array<{ label: string; amount: number; percentage: number }> };
  feed: { purchasedKg: number; consumedKg: number; cost: number; stockKg: number; byType: Array<{ label: string; purchasedKg: number; consumedKg: number; cost: number }> };
  batches: Array<{ id: string; name: string; initialBirds: number; currentBirds: number; mortality: number; mortalityRate: number; birdsSold: number; revenue: number; paid: number; outstanding: number; expenses: number; profit: number; margin: number }>;
  operations: { mortality: number; initialBirds: number; mortalityRate: number; birdsSold: number; salesRate: number; remainingBirds: number; activeBatches: number; completedBatches: number };
  revenueTrend: Array<{ label: string; revenue: number; expenses: number; cash: number }>;
}