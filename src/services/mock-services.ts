import {
  activities,
  batches,
  currentFarm,
  currentUser,
  expenses,
  feedStock,
  healthTasks,
  mortality,
  notifications,
  sales,
  todayTasks,
} from "@/data/mock-data";
import type { DashboardData } from "@/domain/types";

const clone = <T,>(value: T): T => structuredClone(value);

export function getFarmContext() {
  return { farm: clone(currentFarm), user: clone(currentUser) };
}

export function getBatches() {
  return clone(batches);
}

export function getExpenses() {
  return clone(expenses);
}

export function getFeedStock() {
  return clone(feedStock);
}

export function getHealthTasks() {
  return clone(healthTasks);
}

export function getMortality() {
  return clone(mortality);
}

export function getSales() {
  return clone(sales);
}

export function getNotifications() {
  return clone(notifications);
}

export function getActivities() {
  return clone(activities);
}

export function getDashboardData(): DashboardData {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
  const totalMortality = mortality.reduce((sum, record) => sum + record.deaths, 0);
  const deathsToday = mortality.filter((record) => record.date === "2026-09-08").reduce((sum, record) => sum + record.deaths, 0);
  const deathsThisWeek = mortality.reduce((sum, record) => sum + record.deaths, 0);

  return {
    stats: {
      activeBirds: batches.reduce((sum, batch) => sum + batch.currentBirds, 0),
      activeBatches: batches.filter((batch) => batch.status === "active").length,
      expenses: 4850000,
      feedRemainingKg: feedStock.reduce((sum, feed) => sum + feed.remainingKg, 0),
      mortality: totalMortality,
      mortalityRate: 1.35,
      deathsToday,
      deathsThisWeek,
      revenue: 7250000,
      estimatedProfit: 2400000,
      changes: {
        activeBirds: "+2.4%",
        expenses: "+8.1%",
        mortality: "-0.3%",
        revenue: "+12.6%",
        estimatedProfit: "+16.4%",
      },
    },
    expensesOverTime: [
      { label: "Aug 31", expenses: 280000 },
      { label: "Sep 1", expenses: 520000 },
      { label: "Sep 2", expenses: 315000 },
      { label: "Sep 3", expenses: 740000 },
      { label: "Sep 4", expenses: 450000 },
      { label: "Sep 5", expenses: 930000 },
      { label: "Sep 6", expenses: 245000 },
      { label: "Sep 7", expenses: 780000 },
      { label: "Sep 8", expenses: 590000 },
    ],
    expensesByCategory: [
      { label: "Feed", value: 1710000 },
      { label: "Chicks", value: 1620000 },
      { label: "Labour", value: 450000 },
      { label: "Medicine", value: 315000 },
      { label: "Utilities", value: 245000 },
      { label: "Other", value: 510000 },
    ],
    feedConsumption: [
      { label: "Mon", feed: 86 },
      { label: "Tue", feed: 104 },
      { label: "Wed", feed: 98 },
      { label: "Thu", feed: 116 },
      { label: "Fri", feed: 122 },
      { label: "Sat", feed: 128 },
      { label: "Sun", feed: 136 },
    ],
    mortalityTrend: [
      { label: "Sep 2", mortality: 2 },
      { label: "Sep 3", mortality: 4 },
      { label: "Sep 4", mortality: 3 },
      { label: "Sep 5", mortality: 5 },
      { label: "Sep 6", mortality: 1 },
      { label: "Sep 7", mortality: 3 },
      { label: "Sep 8", mortality: 4 },
    ],
    revenueVsExpenses: [
      { label: "Jun", revenue: 5200000, expenses: 3700000 },
      { label: "Jul", revenue: 6100000, expenses: 4100000 },
      { label: "Aug", revenue: 6800000, expenses: 4600000 },
      { label: "Sep", revenue: totalRevenue + 5650000, expenses: totalExpenses },
    ],
    profitTrend: [
      { label: "Jun", profit: 1500000 },
      { label: "Jul", profit: 2000000 },
      { label: "Aug", profit: 2200000 },
      { label: "Sep", profit: 2400000 },
    ],
    batches: getBatches(),
    feedStock: getFeedStock(),
    healthTasks: getHealthTasks(),
    activities: getActivities(),
    todayTasks: clone(todayTasks),
    notifications: getNotifications(),
  };
}