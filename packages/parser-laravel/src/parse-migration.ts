import type { DraftColumn, DraftForeignKey } from "./blueprint.js"
import { parseBlueprintBody } from "./blueprint.js"

export type MigrationOp =
  | {
      kind: "create"
      table: string
      columns: DraftColumn[]
      foreignKeys: DraftForeignKey[]
    }
  | {
      kind: "alter"
      table: string
      columns: DraftColumn[]
      foreignKeys: DraftForeignKey[]
    }
  | { kind: "drop"; table: string }

function stripQuotes(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

/** Take only the `up` method body (or anonymous migration `up` closure). */
export function extractUpBody(source: string): string {
  const upMethod = source.match(
    /function\s+up\s*\([^)]*\)\s*(?::\s*void)?\s*\{/
  )
  if (upMethod && upMethod.index !== undefined) {
    const start = upMethod.index + upMethod[0].length
    return sliceBalancedBlock(source, start)
  }

  // Anonymous migration class with public function up
  return source
}

function sliceBalancedBlock(source: string, start: number): string {
  let depth = 1
  let quote: "'" | '"' | null = null
  let i = start
  while (i < source.length && depth > 0) {
    const ch = source[i]!
    if (quote) {
      if (ch === quote && source[i - 1] !== "\\") {
        quote = null
      }
      i++
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      i++
      continue
    }
    if (ch === "{") {
      depth++
    } else if (ch === "}") {
      depth--
      if (depth === 0) {
        return source.slice(start, i)
      }
    }
    i++
  }
  return source.slice(start)
}

function extractSchemaCallbacks(
  upBody: string,
  method: "create" | "table"
): Array<{ table: string; body: string }> {
  const results: Array<{ table: string; body: string }> = []
  const re = new RegExp(
    `Schema\\s*::\\s*${method}\\s*\\(\\s*(['"])([^'"]+)\\1\\s*,`,
    "g"
  )

  for (const match of upBody.matchAll(re)) {
    const table = match[2]
    if (!table) {
      continue
    }
    let i = match.index + match[0].length
    // skip to function (...) {
    while (i < upBody.length && upBody[i] !== "{") {
      i++
    }
    if (upBody[i] !== "{") {
      continue
    }
    i++ // past {
    const body = sliceBalancedBlock(upBody, i)
    results.push({ table, body })
  }

  return results
}

function extractDrops(upBody: string): string[] {
  const tables: string[] = []
  const re = /Schema\s*::\s*(?:dropIfExists|drop)\s*\(\s*(['"])([^'"]+)\1\s*\)/g
  for (const match of upBody.matchAll(re)) {
    const table = match[2]
    if (table) {
      tables.push(table)
    }
  }
  return tables
}

/** Parse Schema ops from a single migration PHP source (up() only). */
export function parseMigrationSource(source: string): MigrationOp[] {
  const upBody = extractUpBody(source)
  const ops: MigrationOp[] = []

  for (const { table, body } of extractSchemaCallbacks(upBody, "create")) {
    const blueprint = parseBlueprintBody(body)
    ops.push({
      kind: "create",
      table,
      columns: blueprint.columns,
      foreignKeys: blueprint.foreignKeys,
    })
  }

  for (const { table, body } of extractSchemaCallbacks(upBody, "table")) {
    const blueprint = parseBlueprintBody(body)
    ops.push({
      kind: "alter",
      table,
      columns: blueprint.columns,
      foreignKeys: blueprint.foreignKeys,
    })
  }

  for (const table of extractDrops(upBody)) {
    ops.push({ kind: "drop", table })
  }

  return ops
}

export { stripQuotes }
