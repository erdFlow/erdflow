import type { ParseOptions, SchemaAdapter } from "@erdflow/core"
import { detectSqlProject } from "./detect.js"
import { inferSqlDialect } from "./infer-dialect.js"
import { parseMysqlSql } from "./parse-mysql.js"
import { parsePostgresSql } from "./parse-postgres.js"
import { parseSqliteSql } from "./parse-sqlite.js"

export const sqlAdapter: SchemaAdapter = {
  name: "sql",

  async detect(project) {
    return detectSqlProject(project.rootDir)
  },

  async parse(input, options?: ParseOptions) {
    const dialect = options?.dialect ?? inferSqlDialect(input)
    const meta = {
      source: options?.filePath,
      adapter: `sql-${dialect}`,
    }

    switch (dialect) {
      case "postgresql":
        return parsePostgresSql(input, meta)
      case "mysql":
        return parseMysqlSql(input, meta)
      case "sqlite":
        return parseSqliteSql(input, meta)
      default:
        throw new Error(`Unsupported SQL dialect: ${String(dialect)}`)
    }
  },
}
