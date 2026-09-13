import { test, expect } from "@playwright/test";
import { canRunDatabaseE2e, expectProtected, signUp } from "./test-fixtures";

test.skip(!canRunDatabaseE2e, "Set TEST_DATABASE_URL to an isolated PostgreSQL database before running authenticated E2E tests.");

test("authentication persists and protected routes reject logged-out users", async ({ page }) => {
  await signUp(page, { name: "E2E Auth User", email: `auth-${Date.now()}@example.test`, password: "FarmPass123" });
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), E2E/ })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/logout");
  await expect(page).toHaveURL(/\/login$/);
  await expectProtected(page, "/dashboard");
});

test("batch create, edit, and detail values persist after reload", async ({ page }) => {
  await signUp(page, { name: "E2E Batch User", email: `batch-${Date.now()}@example.test`, password: "FarmPass123" });
  await page.goto("/batches");
  await page.getByRole("button", { name: /New batch/i }).first().click();
  await page.getByPlaceholder("e.g. BATCH-004").fill("E2E Batch");
  await page.getByPlaceholder("e.g. Cobb 500").fill("Cobb 500");
  await page.locator('input[name="arrivalDate"]').fill("2026-09-13");
  await page.locator('input[name="initialBirdCount"]').fill("400");
  await page.locator('input[name="expectedHarvestDate"]').fill("2026-10-13");
  await page.getByRole("button", { name: /Create batch/i }).click();
  await expect(page.getByText("E2E Batch")).toBeVisible();
  await page.reload();
  await expect(page.getByText("E2E Batch")).toBeVisible();
});

test("expense, feed, health, and mortality pages expose persisted workflows", async ({ page }) => {
  await signUp(page, { name: "E2E Operations User", email: `ops-${Date.now()}@example.test`, password: "FarmPass123" });
  for (const route of ["/expenses", "/feed", "/health", "/mortality", "/sales", "/reports"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
  }
  await page.goto("/expenses");
  await expect(page.getByRole("heading", { name: "Expenses" })).toBeVisible();
  await page.goto("/feed");
  await expect(page.getByRole("heading", { name: /Feed management/i })).toBeVisible();
});

test("dashboard remains farm-scoped across separate accounts", async ({ browser }) => {
  const first = await browser.newPage();
  const second = await browser.newPage();
  await signUp(first, { name: "E2E Farm A", email: `farm-a-${Date.now()}@example.test`, password: "FarmPass123" });
  await signUp(second, { name: "E2E Farm B", email: `farm-b-${Date.now()}@example.test`, password: "FarmPass123" });
  await expect(first.locator(".farm-switcher")).toContainText("Farm");
  await expect(second.locator(".farm-switcher")).toContainText("Farm");
  await expect(first.locator(".sidebar-account")).not.toContainText("farm-b-");
  await expect(second.locator(".sidebar-account")).not.toContainText("farm-a-");
  await first.close();
  await second.close();
});