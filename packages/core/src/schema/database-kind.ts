import type {
  DatabaseKind,
  DatabaseProvider,
  SqlDialect,
} from "./types.js"

const PROVIDERS = new Set<string>([
  "postgresql",
  "mysql",
  "sqlite",
  "sqlserver",
  "cockroachdb",
  "mongodb",
])

/** Normalize a raw provider string from a datasource block. */
export function parseDatabaseProvider(
  raw: string | undefined | null
): DatabaseProvider {
  if (!raw) {
    return "unknown"
  }
  const normalized = raw.trim().toLowerCase()
  if (PROVIDERS.has(normalized)) {
    return normalized as DatabaseProvider
  }
  // Prisma aliases
  if (normalized === "postgres") {
    return "postgresql"
  }
  return "unknown"
}

export function databaseKindFromProvider(
  provider: DatabaseProvider
): DatabaseKind {
  return provider === "mongodb" ? "document" : "relational"
}

/**
 * Map provider → SQL dialect for DDL helpers.
 * mongodb / sqlserver / unknown → undefined (no SQL dialect path yet).
 */
export function sqlDialectFromProvider(
  provider: DatabaseProvider
): SqlDialect | undefined {
  switch (provider) {
    case "postgresql":
    case "cockroachdb":
      return "postgresql"
    case "mysql":
      return "mysql"
    case "sqlite":
      return "sqlite"
    default:
      return undefined
  }
}
