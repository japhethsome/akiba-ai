/**
 * Secure error handling utility.
 * Prevents information disclosure (leakage of server paths, database tracebacks, ORM internals)
 * that could assist malicious injection attempts.
 */

export function getSafeErrorMessage(
  error: any,
  defaultMessage: string = "An unexpected error occurred. Please try again or contact support."
): string {
  if (!error) return defaultMessage;

  const rawMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = rawMessage.toLowerCase();

  // Keywords that indicate database schema details, file system paths, or ORM internal structures
  const dangerousKeywords = [
    "prisma",
    "database",
    "postgres",
    "connection",
    "pool",
    "timeout",
    "socket",
    "relation",
    "column",
    "table",
    "turbopack",
    "chunks",
    "ssr",
    "internal",
    "bcrypt",
    "crypto",
    "sql",
    "query",
    "select",
    "insert",
    "update",
    "delete",
    "unauthorized",
    "fetch",
    "network",
    "resend",
    "api_key",
    "env",
    "driver",
    "schema",
    "node_modules",
    "stack",
    "trace"
  ];

  // Detect file path separators which leak hosting folder structure
  const containsPath = rawMessage.includes("\\") || rawMessage.includes("/");

  const isDangerous =
    dangerousKeywords.some((keyword) => lowerMessage.includes(keyword)) ||
    containsPath;

  if (isDangerous) {
    return defaultMessage;
  }

  return rawMessage;
}
