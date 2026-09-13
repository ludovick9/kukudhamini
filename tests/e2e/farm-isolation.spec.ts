import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { canRunDatabaseE2e, signUp } from "./test-fixtures";

test.skip(!canRunDatabaseE2e, "Set TEST_DATABASE_URL to an isolated PostgreSQL database before running authenticated E2E tests.");

test("separate farms cannot read each other's batch records", async ({ browser }) => {
  const first = await browser.newPage();
  const second = await browser.newPage();
  const firstEmail = `isolation-a-${Date.now()}@example.test`;
  await signUp(first, { name: "E2E Isolation A", email: firstEmail, password: "FarmPass123" });
  await first.goto("/batches");
  await first.getByRole("button", { name: /New batch/i }).first().click();
  const batchCode = `ISOLATED-${Date.now()}`;
  await first.getByPlaceholder("e.g. BATCH-004").fill(batchCode);
  await first.getByPlaceholder("e.g. Cobb 500").fill("Cobb 500");
  await first.locator('input[name="arrivalDate"]').fill("2026-09-13");
  await first.locator('input[name="initialBirdCount"]').fill("400");
  await first.locator('input[name="expectedHarvestDate"]').fill("2026-10-13");
  await first.getByRole("button", { name: /Create batch/i }).click();
  await expect(first.getByText(batchCode)).toBeVisible();

  const database = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await database.connect();
  const result = await database.query(`SELECT b.id FROM "Batch" b JOIN "FarmMembership" fm ON fm."farmId" = b."farmId" JOIN "User" u ON u.id = fm."userId" WHERE u.email = $1 AND b.name = $2`, [firstEmail, batchCode]);
  await database.end();
  expect(result.rowCount).toBe(1);

  await signUp(second, { name: "E2E Isolation B", email: `isolation-b-${Date.now()}@example.test`, password: "FarmPass123" });
  await second.goto("/batches");
  await expect(second.getByText(batchCode)).toHaveCount(0);
  await second.goto(`/batches/${result.rows[0].id}`);
  await expect(second.getByText(batchCode)).toHaveCount(0);
  await first.close();
  await second.close();
});