import type { DraftColumn, DraftForeignKey } from "./blueprint.js"
import type { MigrationOp } from "./parse-migration.js"

export interface DraftTable {
  name: string
  columns: Map<string, DraftColumn>
  foreignKeys: DraftForeignKey[]
}

export type TableMap = Map<string, DraftTable>

function ensureTable(tables: TableMap, name: string): DraftTable {
  let table = tables.get(name)
  if (!table) {
    table = { name, columns: new Map(), foreignKeys: [] }
    tables.set(name, table)
  }
  return table
}

function mergeColumns(table: DraftTable, columns: DraftColumn[]): void {
  for (const column of columns) {
    table.columns.set(column.name, column)
  }
}

function mergeForeignKeys(
  table: DraftTable,
  foreignKeys: DraftForeignKey[]
): void {
  for (const fk of foreignKeys) {
    const key = `${fk.columns.join(",")}->${fk.referencedTable}`
    const exists = table.foreignKeys.some(
      (existing) =>
        `${existing.columns.join(",")}->${existing.referencedTable}` === key
    )
    if (!exists) {
      table.foreignKeys.push(fk)
    }
  }
}

/** Fold migration ops into a table map (create / alter / drop). */
export function applyMigrationOps(ops: MigrationOp[]): TableMap {
  const tables: TableMap = new Map()

  for (const op of ops) {
    if (op.kind === "drop") {
      tables.delete(op.table)
      continue
    }

    const table = ensureTable(tables, op.table)
    if (op.kind === "create") {
      table.columns.clear()
      table.foreignKeys = []
    }
    mergeColumns(table, op.columns)
    mergeForeignKeys(table, op.foreignKeys)
  }

  return tables
}
