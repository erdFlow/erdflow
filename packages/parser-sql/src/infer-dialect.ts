export type SqlDialect = "postgresql" | "mysql" | "sqlite";

export function inferSqlDialect(sql: string): SqlDialect {
  const normalized = sql.toLowerCase();

  if (
    normalized.includes("autoincrement") ||
    normalized.includes("without rowid")
  ) {
    return "sqlite";
  }

  if (
    normalized.includes("auto_increment") ||
    normalized.includes("engine=innodb") ||
    sql.includes("`")
  ) {
    return "mysql";
  }

  if (
    normalized.includes(" serial") ||
    normalized.includes("create type") ||
    normalized.includes("::")
  ) {
    return "postgresql";
  }

  return "postgresql";
}
