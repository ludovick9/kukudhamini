import { NextResponse } from "next/server";
import { getPrisma } from "@/server/db";
import { logger } from "@/server/logger";
import { validateEnvironment } from "@/server/environment";

export async function GET() {
  try {
    validateEnvironment({ requireDatabase: true });
    await getPrisma().$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch (error) {
    logger.error("Health check failed", error, { operation: "healthCheck" });
    return NextResponse.json({ status: "error", database: "error" }, { status: 503 });
  }
}