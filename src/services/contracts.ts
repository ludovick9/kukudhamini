import type { Batch, DashboardData, Expense, Farm, FeedStock, HealthTask, MortalityRecord, Notification, Sale, User } from "@/domain/types";

export interface FarmService {
  getContext(): Promise<{ farm: Farm; user: User }>;
}

export interface BatchService {
  list(farmId: string): Promise<Batch[]>;
}

export interface ExpenseService {
  list(farmId: string): Promise<Expense[]>;
}

export interface FeedService {
  getStock(farmId: string): Promise<FeedStock[]>;
}

export interface HealthTaskService {
  list(farmId: string): Promise<HealthTask[]>;
}

export interface MortalityService {
  list(farmId: string): Promise<MortalityRecord[]>;
}

export interface SalesService {
  list(farmId: string): Promise<Sale[]>;
}

export interface NotificationService {
  list(farmId: string): Promise<Notification[]>;
}

export interface DashboardService {
  get(farmId: string): Promise<DashboardData>;
}