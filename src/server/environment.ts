export type RuntimeEnvironment = "development" | "test" | "production";

export function runtimeEnvironment(): RuntimeEnvironment {
  const value = process.env.NODE_ENV;
  return value === "production" || value === "test" ? value : "development";
}

export function validateEnvironment(options: { requireDatabase?: boolean } = {}) {
  const requireDatabase = options.requireDatabase ?? runtimeEnvironment() === "production";
  const missing: string[] = [];

  if (requireDatabase && !process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (runtimeEnvironment() === "test" && !process.env.TEST_DATABASE_URL) missing.push("TEST_DATABASE_URL");

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable: ${missing.join(", ")}`);
  }

  return {
    databaseUrl: process.env.DATABASE_URL,
    testDatabaseUrl: process.env.TEST_DATABASE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  };
}