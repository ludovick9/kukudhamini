import { logger } from "@/server/logger";

const unsafeMessage = /Prisma|prisma|invocation|SQLSTATE|relation .* does not exist|column .* does not exist|DATABASE_URL|postgres(ql)?:\/\//;

export function safeActionMessage(error: unknown, fallback: string, operation: string) {
  logger.error("Server action failed", error, { operation });
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues?: Array<{ message?: string }> }).issues ?? [];
    const message = issues.map((issue) => issue.message).filter(Boolean).join(" ");
    if (message && !unsafeMessage.test(message)) return message;
  }
  if (error instanceof Error && error.message && error.message.length <= 240 && !unsafeMessage.test(error.message)) return error.message;
  return fallback;
}