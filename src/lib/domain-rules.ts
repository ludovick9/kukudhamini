export type MutationRole = "OWNER" | "MANAGER" | "WORKER";

export function canMutateFarm(role: MutationRole) {
  return role === "OWNER" || role === "MANAGER";
}

export function currentBirds(initialBirds: number, mortality: number, sold: number) {
  return Math.max(0, initialBirds - mortality - sold);
}

export function availableBirds(initialBirds: number, mortality: number, sold: number) {
  return currentBirds(initialBirds, mortality, sold);
}

export function feedStock(purchased: number, consumed: number, adjustments = 0) {
  return Math.max(0, purchased - consumed + adjustments);
}

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID";

export function paymentStatus(revenue: number, paid: number): PaymentStatus {
  if (paid <= 0) return "UNPAID";
  return paid >= revenue ? "PAID" : "PARTIAL";
}

export function financialSummary(revenue: number, cashReceived: number, expenses: number) {
  const outstanding = Math.max(0, revenue - cashReceived);
  const profit = revenue - expenses;
  return { revenue, cashReceived, outstanding, expenses, profit, margin: revenue ? (profit / revenue) * 100 : 0 };
}
