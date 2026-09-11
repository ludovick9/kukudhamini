import assert from "node:assert/strict";
import test from "node:test";
import { canMutateFarm, currentBirds, feedStock, financialSummary, paymentStatus } from "@/lib/domain-rules";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { feedTransactionInputSchema, mortalityInputSchema } from "@/lib/validation/database";

test("password hashes verify and reject invalid credentials", () => {
  const hash = hashPassword("FarmPass123");
  assert.equal(verifyPassword("FarmPass123", hash), true);
  assert.equal(verifyPassword("wrong-password", hash), false);
});

test("mutation permissions allow owners and managers only", () => {
  assert.equal(canMutateFarm("OWNER"), true);
  assert.equal(canMutateFarm("MANAGER"), true);
  assert.equal(canMutateFarm("WORKER"), false);
});

test("current birds never becomes negative", () => {
  assert.equal(currentBirds(100, 20, 30), 50);
  assert.equal(currentBirds(100, 80, 40), 0);
});

test("feed stock follows purchased minus consumed plus adjustments", () => {
  assert.equal(feedStock(500, 125), 375);
  assert.equal(feedStock(500, 600), 0);
  assert.equal(feedStock(500, 600, 20), 0);
});

test("payment lifecycle and outstanding balance are consistent", () => {
  assert.equal(paymentStatus(1000, 0), "UNPAID");
  assert.equal(paymentStatus(1000, 400), "PARTIAL");
  assert.equal(paymentStatus(1000, 1000), "PAID");
  assert.deepEqual(financialSummary(1000, 400, 250), { revenue: 1000, cashReceived: 400, outstanding: 600, expenses: 250, profit: 750, margin: 75 });
});

test("validation rejects feed purchases without price", () => {
  const result = feedTransactionInputSchema.safeParse({ farmId: "farm", productId: "product", type: "PURCHASE", quantity: 10, unit: "kg", date: "2026-09-10" });
  assert.equal(result.success, false);
});

test("validation rejects non-positive mortality", () => {
  const result = mortalityInputSchema.safeParse({ farmId: "farm", batchId: "batch", date: "2026-09-10", quantity: 0 });
  assert.equal(result.success, false);
});
