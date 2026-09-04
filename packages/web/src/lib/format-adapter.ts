/** Human-readable labels for schema adapters / dialects. */

const ADAPTER_LABELS: Record<string, string> = {
  prisma: "Prisma",
  drizzle: "Drizzle",
  dbml: "DBML",
  typeorm: "TypeORM",
  mongoose: "Mongoose",
  laravel: "Laravel",
  sql: "SQL",
  "sql-postgresql": "PostgreSQL",
  "sql-mysql": "MySQL",
  "sql-sqlite": "SQLite",
}

export function formatAdapterLabel(adapter: string | undefined | null): string {
  if (!adapter) {
    return "Unknown"
  }

  const key = adapter.trim().toLowerCase()
  const known = ADAPTER_LABELS[key]
  if (known) {
    return known
  }

  // sql-<dialect> fallback
  if (key.startsWith("sql-")) {
    const dialect = key.slice(4)
    return dialect.charAt(0).toUpperCase() + dialect.slice(1)
  }

  return adapter.charAt(0).toUpperCase() + adapter.slice(1)
}
