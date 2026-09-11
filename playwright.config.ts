import { defineConfig, devices } from "@playwright/test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl && testDatabaseUrl === process.env.DATABASE_URL) {
  throw new Error("TEST_DATABASE_URL must be different from DATABASE_URL.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: "line",
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: testDatabaseUrl ? {
    command: "npm run dev -- --port 3100",
    url: "http://localhost:3100/login",
    reuseExistingServer: false,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  } : undefined,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" } } }],
});
