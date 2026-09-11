import type {
  Activity,
  Batch,
  Expense,
  Farm,
  FeedStock,
  HealthTask,
  MortalityRecord,
  Notification,
  Sale,
  TodayTask,
  User,
} from "@/domain/types";

export const currentFarm: Farm = {
  id: "farm-001",
  name: "KukuDhamini Poultry Farm",
  location: "Morogoro, Tanzania",
  currency: "TZS",
  timezone: "Africa/Dar_es_Salaam",
  unreadNotificationCount: 3,
};

export const currentUser: User = {
  id: "user-001",
  name: "Farm Manager",
  role: "Farm manager",
  initials: "FM",
};

export const batches: Batch[] = [
  {
    id: "batch-001",
    code: "BATCH-001",
    name: "September Starter",
    breed: "Cobb 500",
    arrivalDate: "2026-08-25",
    ageDays: 14,
    initialBirds: 2040,
    currentBirds: 2000,
    mortality: 24,
    mortalityRate: 1.2,
    harvestDate: "2026-10-06",
    daysRemaining: 28,
    status: "active",
  },
  {
    id: "batch-002",
    code: "BATCH-002",
    name: "August Growers",
    breed: "Ross 308",
    arrivalDate: "2026-08-18",
    ageDays: 21,
    initialBirds: 1532,
    currentBirds: 1500,
    mortality: 32,
    mortalityRate: 2.1,
    harvestDate: "2026-09-29",
    daysRemaining: 21,
    status: "active",
  },
  {
    id: "batch-003",
    code: "BATCH-003",
    name: "September Growers",
    breed: "Cobb 500",
    arrivalDate: "2026-09-01",
    ageDays: 7,
    initialBirds: 1359,
    currentBirds: 1350,
    mortality: 9,
    mortalityRate: 0.7,
    harvestDate: "2026-10-13",
    daysRemaining: 35,
    status: "active",
  },
];

export const expenses: Expense[] = [
  { id: "expense-001", date: "2026-09-08", category: "Feed", description: "Grower feed delivery", amount: 780000, supplier: "Mkulima Feeds", batchCode: "BATCH-002" },
  { id: "expense-002", date: "2026-09-07", category: "Chicks", description: "Day-old chicks", amount: 1620000, supplier: "Tanzania Hatchery", batchCode: "BATCH-003" },
  { id: "expense-003", date: "2026-09-06", category: "Utilities", description: "Electricity and water", amount: 245000, supplier: "Morogoro Utilities" },
  { id: "expense-004", date: "2026-09-05", category: "Feed", description: "Starter feed delivery", amount: 930000, supplier: "Mkulima Feeds", batchCode: "BATCH-003" },
  { id: "expense-005", date: "2026-09-04", category: "Labour", description: "Weekly farm labour", amount: 450000, supplier: "Farm team" },
  { id: "expense-006", date: "2026-09-02", category: "Medicine", description: "Health supplies", amount: 315000, supplier: "Afya Vet Supplies" },
  { id: "expense-007", date: "2026-09-01", category: "Transport", description: "Feed transport", amount: 180000, supplier: "Jirani Logistics" },
  { id: "expense-008", date: "2026-08-30", category: "Equipment", description: "New drinkers", amount: 330000, supplier: "Farm Store" },
];

export const feedStock: FeedStock[] = [
  { id: "feed-001", type: "Starter", remainingKg: 120, purchasedKg: 900, consumedKg: 780, thresholdKg: 150, unitCost: 1850 },
  { id: "feed-002", type: "Grower", remainingKg: 320, purchasedKg: 920, consumedKg: 600, thresholdKg: 250, unitCost: 1720 },
  { id: "feed-003", type: "Finisher", remainingKg: 180, purchasedKg: 700, consumedKg: 520, thresholdKg: 220, unitCost: 1680 },
];

export const healthTasks: HealthTask[] = [
  { id: "health-001", name: "Newcastle vaccination", type: "Vaccine", batchCode: "BATCH-002", scheduledDate: "2026-09-07", relativeDate: "Yesterday", status: "missed", instructions: "Farmer-entered schedule" },
  { id: "health-002", name: "Health check", type: "Other health task", batchCode: "BATCH-003", scheduledDate: "2026-09-09", relativeDate: "Tomorrow", status: "upcoming", instructions: "Review flock condition" },
  { id: "health-003", name: "Vitamin supplement", type: "Medicine", batchCode: "BATCH-001", scheduledDate: "2026-09-08", relativeDate: "Today", status: "completed", instructions: "Completed by farm manager" },
];

export const mortality: MortalityRecord[] = [
  { id: "mortality-001", date: "2026-09-08", batchCode: "BATCH-002", deaths: 4, cause: "Unspecified" },
  { id: "mortality-002", date: "2026-09-07", batchCode: "BATCH-001", deaths: 3, cause: "Unspecified" },
  { id: "mortality-003", date: "2026-09-06", batchCode: "BATCH-003", deaths: 1, cause: "Unspecified" },
  { id: "mortality-004", date: "2026-09-05", batchCode: "BATCH-002", deaths: 5, cause: "Unspecified" },
];

export const sales: Sale[] = [
  { id: "sale-001", date: "2026-09-08", batchCode: "BATCH-002", birds: 120, totalWeightKg: 228, revenue: 912000, buyer: "Mji Fresh Market" },
  { id: "sale-002", date: "2026-09-03", batchCode: "BATCH-001", birds: 80, totalWeightKg: 142, revenue: 568000, buyer: "Mama Ntilie Group" },
];

export const notifications: Notification[] = [
  { id: "notification-001", type: "health", title: "Missed vaccination", message: "Newcastle vaccination for BATCH-002 needs attention.", time: "Yesterday", priority: "critical", read: false, status: "missed", batchCode: "BATCH-002" },
  { id: "notification-002", type: "feed", title: "Starter feed is low", message: "120 kg remaining, below the 150 kg threshold.", time: "2 hours ago", priority: "high", read: false, status: "warning" },
  { id: "notification-003", type: "health", title: "Health task tomorrow", message: "Health check scheduled for BATCH-003.", time: "Today", priority: "medium", read: false, status: "upcoming", batchCode: "BATCH-003" },
  { id: "notification-004", type: "harvest", title: "Harvest date approaching", message: "BATCH-002 is ready for planning in 21 days.", time: "Today", priority: "medium", read: true, status: "upcoming", batchCode: "BATCH-002" },
];

export const activities: Activity[] = [
  { id: "activity-001", title: "Feed purchase recorded", description: "460 kg Grower feed from Mkulima Feeds", time: "24 minutes ago", type: "feed" },
  { id: "activity-002", title: "Mortality recorded", description: "4 birds from BATCH-002", time: "2 hours ago", type: "mortality" },
  { id: "activity-003", title: "Health task completed", description: "Vitamin supplement for BATCH-001", time: "Today, 08:15", type: "health" },
  { id: "activity-004", title: "Expense added", description: "Grower feed delivery · TZS 780,000", time: "Yesterday", type: "expense" },
  { id: "activity-005", title: "Birds sold", description: "120 birds to Mji Fresh Market", time: "Yesterday", type: "sale" },
  { id: "activity-006", title: "New batch created", description: "BATCH-003 · 1,359 chicks", time: "1 week ago", type: "batch" },
];

export const todayTasks: TodayTask[] = [
  { id: "task-001", title: "Missed medication", detail: "Review Newcastle vaccination record", dueLabel: "Yesterday", type: "health", priority: "urgent", status: "open", actionLabel: "Review", relatedCode: "BATCH-002" },
  { id: "task-002", title: "Vaccination tomorrow", detail: "Health task scheduled for the flock", dueLabel: "Tomorrow · 09:00", type: "health", priority: "attention", status: "scheduled", actionLabel: "View task", relatedCode: "BATCH-003" },
  { id: "task-003", title: "Starter feed is low", detail: "120 kg left · threshold is 150 kg", dueLabel: "Restock soon", type: "feed", priority: "attention", status: "open", actionLabel: "Check stock" },
  { id: "task-004", title: "Harvest planning", detail: "Prepare buyer and transport for the next sale", dueLabel: "21 days", type: "harvest", priority: "ready", status: "monitoring", actionLabel: "View batch", relatedCode: "BATCH-002" },
  { id: "task-005", title: "Record today's mortality", detail: "4 birds recorded so far today", dueLabel: "Today", type: "mortality", priority: "attention", status: "open", actionLabel: "Record", relatedCode: "BATCH-002" },
];