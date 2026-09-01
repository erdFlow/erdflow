import type { SchemaMeta, UniversalSchema } from "@erdflow/core";
import { Parser } from "@dbml/core";
import { mapDbmlDatabase } from "@erdflow/parser-dbml/mapper";

export function parseMysqlSql(
  input: string,
  meta?: SchemaMeta,
): UniversalSchema {
  const database = new Parser().parse(input, "mysql");
  return mapDbmlDatabase(database, meta);
}
