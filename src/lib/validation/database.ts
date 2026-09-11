import { z } from "zod";

const positiveDecimal = z.coerce.number().finite().nonnegative();

export const idSchema = z.string().trim().min(1);
export const batchInputSchema = z.object({
  name: z.string().trim().min(1, "Batch name or code is required.").max(120),
  breed: z.string().trim().min(1, "Breed is required.").max(80),
  arrivalDate: z.coerce.date(),
  initialBirdCount: z.coerce.number().int().positive("Bird count must be greater than zero."),
  expectedHarvestDate: z.coerce.date(),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]),
  notes: z.string().trim().max(2000).optional(),
}).superRefine((input, context) => {
  if (input.expectedHarvestDate < input.arrivalDate) {
    context.addIssue({ code: "custom", message: "Harvest date cannot be before the arrival date.", path: ["expectedHarvestDate"] });
  }
});

export const batchStatusSchema = z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]);
export const expenseInputSchema = z.object({
  farmId: idSchema,
  batchId: idSchema.optional(),
  categoryId: idSchema,
  supplierId: idSchema.optional(),
  date: z.coerce.date(),
  description: z.string().trim().min(1).max(240),
  quantity: positiveDecimal,
  unit: z.string().trim().min(1).max(24),
  unitPrice: z.coerce.number().finite().positive("Amount must be greater than zero."),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "CARD", "CREDIT", "OTHER"]),
  notes: z.string().trim().max(1000).optional(),
}).transform((input) => ({ ...input, totalAmount: input.quantity * input.unitPrice }));

export const feedProductInputSchema = z.object({
  farmId: idSchema,
  name: z.string().trim().min(1).max(120),
  type: z.enum(["STARTER", "GROWER", "FINISHER"]),
  lowStockThreshold: positiveDecimal,
});

export const feedTransactionInputSchema = z.object({
  farmId: idSchema,
  batchId: idSchema.optional(),
  productId: idSchema,
  supplierId: idSchema.optional(),
  type: z.enum(["PURCHASE", "CONSUMPTION", "ADJUSTMENT"]),
  quantity: z.coerce.number().finite().positive("Quantity must be greater than zero."),
  unit: z.string().trim().min(1).max(24),
  unitPrice: positiveDecimal.optional(),
  date: z.coerce.date(),
  notes: z.string().trim().max(1000).optional(),
}).superRefine((input, context) => {
  if (input.type === "PURCHASE" && input.unitPrice === undefined) {
    context.addIssue({ code: "custom", message: "Purchases require a unit price.", path: ["unitPrice"] });
  }
});

export const healthTaskInputSchema = z.object({
  farmId: idSchema,
  batchId: idSchema.optional(),
  title: z.string().trim().min(1).max(200),
  type: z.enum(["MEDICINE", "VACCINATION", "OTHER"]),
  scheduledAt: z.coerce.date(),
  instructions: z.string().trim().max(2000).optional(),
  status: z.enum(["UPCOMING", "COMPLETED", "MISSED", "OVERDUE"]).default("UPCOMING"),
  notes: z.string().trim().max(1000).optional(),
});

export const mortalityInputSchema = z.object({
  farmId: idSchema,
  batchId: idSchema,
  date: z.coerce.date(),
  quantity: z.coerce.number().int().positive("Deaths must be greater than zero."),
  cause: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const saleInputSchema = z.object({
  farmId: idSchema,
  batchId: idSchema,
  customerId: idSchema.optional(),
  date: z.coerce.date(),
  birdsSold: z.coerce.number().int().positive("Birds sold must be greater than zero."),
  totalWeight: positiveDecimal.optional(),
  pricingMode: z.enum(["PER_KG", "PER_BIRD"]),
  pricePerKg: positiveDecimal.optional(),
  pricePerBird: positiveDecimal.optional(),
  notes: z.string().trim().max(1000).optional(),
}).superRefine((input, context) => {
  if (input.pricingMode === "PER_KG" && (input.totalWeight === undefined || input.pricePerKg === undefined || input.pricePerBird !== undefined)) {
    context.addIssue({ code: "custom", message: "Per-kilogram sales require total weight and price per kilogram only.", path: ["pricingMode"] });
  }
  if (input.pricingMode === "PER_BIRD" && (input.pricePerBird === undefined || input.pricePerKg !== undefined)) {
    context.addIssue({ code: "custom", message: "Per-bird sales require price per bird only.", path: ["pricingMode"] });
  }
});

export const paymentInputSchema = z.object({
  saleId: idSchema,
  amount: z.coerce.number().finite().positive("Payment amount must be greater than zero."),
  paymentMethod: z.enum(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "CARD", "CREDIT", "OTHER"]),
  paymentDate: z.coerce.date(),
  reference: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const healthTaskStatusSchema = z.enum(["UPCOMING", "COMPLETED", "MISSED", "OVERDUE"]);