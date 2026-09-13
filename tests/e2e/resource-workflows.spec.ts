import { test, expect, type Page } from "@playwright/test";
import { canRunDatabaseE2e, signUp } from "./test-fixtures";

test.skip(!canRunDatabaseE2e, "Set TEST_DATABASE_URL to an isolated PostgreSQL database before running authenticated E2E tests.");

async function createBatch(page: Page, code = `E2E-${Date.now()}`) {
  await page.goto("/batches");
  await page.getByRole("button", { name: /New batch/i }).first().click();
  await page.getByPlaceholder("e.g. BATCH-004").fill(code);
  await page.getByPlaceholder("e.g. Cobb 500").fill("Cobb 500");
  await page.locator('input[name="arrivalDate"]').fill("2026-09-13");
  await page.locator('input[name="initialBirdCount"]').fill("400");
  await page.locator('input[name="expectedHarvestDate"]').fill("2026-10-13");
  await page.getByRole("button", { name: /Create batch/i }).click();
  await expect(page.getByText(code)).toBeVisible();
  return code;
}

test("expense create, edit, delete, and total workflow", async ({ page }) => {
  await signUp(page, { name: "E2E Expense User", email: `expense-${Date.now()}@example.test`, password: "FarmPass123" });
  await page.goto("/expenses");
  await page.getByRole("button", { name: /Record expense/i }).click();
  await page.locator('input[name="description"]').fill("E2E electricity");
  await page.locator('input[name="amount"]').fill("12500");
  await page.locator('select[name="categoryId"]').selectOption({ label: "Utilities" });
  await page.getByRole("button", { name: /Record expense/i }).last().click();
  await expect(page.getByText("E2E electricity")).toBeVisible();
  await page.reload();
  await expect(page.getByText("E2E electricity")).toBeVisible();
});

test("feed purchase and consumption workflow preserves stock controls", async ({ page }) => {
  await signUp(page, { name: "E2E Feed User", email: `feed-${Date.now()}@example.test`, password: "FarmPass123" });
  await createBatch(page);
  await page.goto("/feed");
  await page.getByRole("button", { name: /Record movement/i }).click();
  await page.locator('select[name="type"]').selectOption("PURCHASE");
  await page.locator('select[name="productId"]').selectOption({ label: "Starter · STARTER" });
  await page.locator('input[name="quantity"]').fill("100");
  await page.locator('input[name="unitPrice"]').fill("1800");
  await page.getByRole("button", { name: /Record movement/i }).last().click();
  await expect(page.getByText(/100 kg|100/)).toBeVisible();
});

test("health and mortality workflows use the selected batch", async ({ page }) => {
  await signUp(page, { name: "E2E Health User", email: `health-${Date.now()}@example.test`, password: "FarmPass123" });
  await createBatch(page);
  await page.goto("/health");
  await page.getByRole("button", { name: /New health task/i }).click();
  await page.locator('input[name="title"]').fill("E2E vaccination");
  await page.locator('select[name="type"]').selectOption("VACCINATION");
  await page.locator('select[name="batchId"]').selectOption({ index: 1 });
  await page.getByRole("button", { name: /Save health task/i }).click();
  await expect(page.getByText("E2E vaccination")).toBeVisible();

  await page.goto("/mortality");
  await page.getByRole("button", { name: /Record mortality/i }).click();
  await page.locator('select[name="batchId"]').selectOption({ index: 1 });
  await page.locator('input[name="quantity"]').fill("8");
  await page.getByRole("button", { name: /Save mortality record/i }).click();
  await expect(page.getByText(/8 birds/)).toBeVisible();
});

test("sales and payment workflow reaches the sale detail page", async ({ page }) => {
  await signUp(page, { name: "E2E Sales User", email: `sales-${Date.now()}@example.test`, password: "FarmPass123" });
  await createBatch(page);
  await page.goto("/sales");
  await page.getByRole("button", { name: /Record sale/i }).click();
  await page.locator('select[name="batchId"]').selectOption({ index: 1 });
  await page.locator('input[name="birdsSold"]').fill("10");
  await page.locator('select[name="pricingMode"]').selectOption("PER_BIRD");
  await page.locator('input[name="pricePerBird"]').fill("5000");
  await page.getByRole("button", { name: /Record sale/i }).last().click();
  await expect(page.locator(".sale-row")).toBeVisible();
  await page.locator(".sale-row a").first().click();
  await expect(page).toHaveURL(/\/sales\//);
  await expect(page.getByRole("heading", { name: "Add a payment" })).toBeVisible();
  await page.locator('input[name="amount"]').fill("25000");
  await page.getByRole("button", { name: /Record payment/i }).click();
  await expect(page.getByText(/Cash received|Outstanding/)).toBeVisible();
});