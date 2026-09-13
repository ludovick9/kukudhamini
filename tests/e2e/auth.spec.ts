import { test, expect } from "@playwright/test";
import { Client } from "pg";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
test.skip(!testDatabaseUrl, "Set TEST_DATABASE_URL to an isolated test database before running authenticated E2E tests.");

test("sign up, persist session, greet user, and log out", async ({ page }) => {
  const navigationTimeout = 15000;
  const name = `E2E User ${Date.now()}`;
  const email = `e2e-${Date.now()}@example.test`;

  await page.goto("/signup");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.locator('input[name="password"]').fill("FarmPass123");
  await page.locator('input[name="confirmPassword"]').fill("FarmPass123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: navigationTimeout });
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), E2E\./ })).toBeVisible();

  const database = new Client({ connectionString: testDatabaseUrl });
  await database.connect();
  try {
    const persistence = await database.query(`
      SELECT u.id, u.name, u.email, f.id AS farm_id, fm.role,
        EXISTS (
          SELECT 1 FROM "Session" s
          WHERE s."userId" = u.id AND s."expiresAt" > NOW()
        ) AS session_active
      FROM "User" u
      JOIN "FarmMembership" fm ON fm."userId" = u.id
      JOIN "Farm" f ON f.id = fm."farmId"
      WHERE u.email = $1
    `, [email]);

    expect(persistence.rowCount).toBe(1);
    expect(persistence.rows[0]).toMatchObject({ name, email, role: "OWNER", session_active: true });
    expect(persistence.rows[0].farm_id).toBeTruthy();
  } finally {
    await database.end();
  }

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening), E2E\./ })).toBeVisible();
  await page.locator(".user-chip").click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("#account-menu")).toBeVisible();
  await expect(page.locator("#account-menu")).toContainText(email);
  await page.keyboard.press("Escape");
  await expect(page.locator("#account-menu")).toBeHidden();

  await page.goto("/settings");
  await page.locator("button.language-option").filter({ hasText: "Kiswahili" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.getByRole("heading", { name: "Mipangilio" })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByText("Kuku waliopo")).toBeVisible();
  await page.goto("/settings");
  await page.locator("button.language-option").filter({ hasText: "Kiingereza" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.locator(".sidebar-account")).toContainText(name);
  await expect(page.locator(".sidebar-account")).toContainText(email);
  await page.locator(".user-chip").click();
  await page.locator("#account-menu").getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
