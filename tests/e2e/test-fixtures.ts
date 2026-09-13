import { expect, type Page } from "@playwright/test";

export const testDatabaseUrl = process.env.TEST_DATABASE_URL;
export const canRunDatabaseE2e = Boolean(testDatabaseUrl);

export function uniqueIdentity(prefix: string) {
  const id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { name: `E2E ${prefix}`, email: `${id}@example.test`, password: "FarmPass123" };
}

export async function signUp(page: Page, identity = uniqueIdentity("User")) {
  await page.goto("/signup");
  await page.getByLabel("Full name").fill(identity.name);
  await page.getByLabel("Email").fill(identity.email);
  await page.locator('input[name="password"]').fill(identity.password);
  await page.locator('input[name="confirmPassword"]').fill(identity.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return identity;
}

export async function logOut(page: Page) {
  await page.locator(".user-chip").click();
  await page.locator("#account-menu").getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function expectProtected(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login$/);
}