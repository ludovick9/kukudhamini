import test from "node:test";
import assert from "node:assert/strict";
import { validateEnvironment } from "../src/server/environment";
import { safeActionMessage } from "../src/server/action-errors";
import { GET as healthCheck } from "../src/app/api/health/route";

const environment = process.env as Record<string, string | undefined>;

test("production environment validation requires DATABASE_URL without exposing a value", () => {
  const previousNodeEnv = environment.NODE_ENV;
  const previousDatabaseUrl = environment.DATABASE_URL;
  environment.NODE_ENV = "production";
  delete environment.DATABASE_URL;
  try {
    assert.throws(() => validateEnvironment(), (error: unknown) => error instanceof Error && error.message === "Missing required environment variable: DATABASE_URL");
  } finally {
    if (previousNodeEnv === undefined) delete environment.NODE_ENV; else environment.NODE_ENV = previousNodeEnv;
    if (previousDatabaseUrl === undefined) delete environment.DATABASE_URL; else environment.DATABASE_URL = previousDatabaseUrl;
  }
});

test("development environment can use the intentional mock fallback", () => {
  const previousNodeEnv = environment.NODE_ENV;
  const previousDatabaseUrl = environment.DATABASE_URL;
  environment.NODE_ENV = "development";
  delete environment.DATABASE_URL;
  try {
    assert.doesNotThrow(() => validateEnvironment());
  } finally {
    if (previousNodeEnv === undefined) delete environment.NODE_ENV; else environment.NODE_ENV = previousNodeEnv;
    if (previousDatabaseUrl === undefined) delete environment.DATABASE_URL; else environment.DATABASE_URL = previousDatabaseUrl;
  }
});

test("technical database errors are replaced with safe action messages", () => {
  const message = safeActionMessage(new Error("PrismaClientKnownRequestError DATABASE_URL=secret"), "Unable to save the record. Please try again.", "testAction");
  assert.equal(message, "Unable to save the record. Please try again.");
  assert.doesNotMatch(message, /DATABASE_URL|secret|Prisma/);
});

test("health endpoint fails safely when the database configuration is missing", async () => {
  const previousDatabaseUrl = environment.DATABASE_URL;
  delete environment.DATABASE_URL;
  try {
    const response = await healthCheck();
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: "error", database: "error" });
  } finally {
    if (previousDatabaseUrl === undefined) delete environment.DATABASE_URL; else environment.DATABASE_URL = previousDatabaseUrl;
  }
});