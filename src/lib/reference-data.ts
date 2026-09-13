export const DEFAULT_EXPENSE_CATEGORIES = [
  "Bedding",
  "Chicks",
  "Coal",
  "Electricity",
  "Equipment",
  "Feed",
  "Labour",
  "Medicine",
  "Transport",
  "Utilities",
  "Water",
] as const;

export const DEFAULT_FEED_PRODUCTS = [
  { type: "STARTER" as const, name: "Starter", lowStockThreshold: 50 },
  { type: "GROWER" as const, name: "Grower", lowStockThreshold: 250 },
  { type: "FINISHER" as const, name: "Finisher", lowStockThreshold: 220 },
] as const;