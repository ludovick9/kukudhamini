type LogContext = Record<string, string | number | boolean | undefined>;

function write(level: "info" | "warn" | "error", message: string, context: LogContext = {}) {
  const payload = { timestamp: new Date().toISOString(), level, message, ...context };
  if (level === "error") console.error(JSON.stringify(payload));
  else if (level === "warn") console.warn(JSON.stringify(payload));
  else console.info(JSON.stringify(payload));
}

export const logger = {
  info(message: string, context?: LogContext) { write("info", message, context); },
  warn(message: string, context?: LogContext) { write("warn", message, context); },
  error(message: string, error?: unknown, context: LogContext = {}) {
    write("error", message, { ...context, errorType: error instanceof Error ? error.name : typeof error });
  },
};