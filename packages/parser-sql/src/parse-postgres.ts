import { Parser } from "@dbml/core"
import type { SchemaMeta, UniversalSchema } from "@erdflow/core"
import { mapDbmlDatabase } from "@erdflow/parser-dbml/mapper"

export function parsePostgresSql(
  input: string,
  meta?: SchemaMeta
): UniversalSchema {
  const database = new Parser().parse(input, "postgres")
  return mapDbmlDatabase(database, meta)
}
