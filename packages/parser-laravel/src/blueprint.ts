import type { IdStrategy, ReferentialAction } from "@erdflow/core"

export interface DraftColumn {
  name: string
  typeName: string
  nullable: boolean
  unique?: boolean
  isPrimaryKey?: boolean
  idStrategy?: IdStrategy
  default?: string
  comment?: string
}

export interface DraftForeignKey {
  columns: string[]
  referencedTable: string
  referencedColumns: string[]
  onDelete?: ReferentialAction
  onUpdate?: ReferentialAction
}

export interface BlueprintResult {
  columns: DraftColumn[]
  foreignKeys: DraftForeignKey[]
}

interface MethodCall {
  name: string
  args: string[]
}

const COLUMN_METHODS = new Set([
  "id",
  "increments",
  "bigIncrements",
  "integer",
  "bigInteger",
  "unsignedBigInteger",
  "tinyInteger",
  "smallInteger",
  "mediumInteger",
  "string",
  "char",
  "text",
  "mediumText",
  "longText",
  "boolean",
  "uuid",
  "ulid",
  "json",
  "jsonb",
  "float",
  "double",
  "decimal",
  "date",
  "dateTime",
  "dateTimeTz",
  "time",
  "timestamp",
  "timestampTz",
  "binary",
  "enum",
  "foreignId",
  "foreignUuid",
  "foreignUlid",
  "foreignIdFor",
])

const MULTI_COLUMN_METHODS = new Set([
  "timestamps",
  "timestampsTz",
  "nullableTimestamps",
  "softDeletes",
  "softDeletesTz",
  "rememberToken",
])

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

function splitArgs(argsSource: string): string[] {
  const args: string[] = []
  let current = ""
  let depth = 0
  let quote: "'" | '"' | null = null

  for (let i = 0; i < argsSource.length; i++) {
    const ch = argsSource[i]!
    if (quote) {
      current += ch
      if (ch === quote && argsSource[i - 1] !== "\\") {
        quote = null
      }
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      current += ch
      continue
    }
    if (ch === "(") {
      depth++
      current += ch
      continue
    }
    if (ch === ")") {
      depth--
      current += ch
      continue
    }
    if (ch === "," && depth === 0) {
      if (current.trim()) {
        args.push(current.trim())
      }
      current = ""
      continue
    }
    current += ch
  }

  if (current.trim()) {
    args.push(current.trim())
  }
  return args
}

function parseMethodCalls(chain: string): MethodCall[] {
  const calls: MethodCall[] = []
  let i = 0
  const src = chain.trim()

  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i]!)) {
      i++
    }
    if (src.startsWith("->", i)) {
      i += 2
      continue
    }

    const nameMatch = src.slice(i).match(/^([A-Za-z_][A-Za-z0-9_]*)/)
    if (!nameMatch) {
      break
    }
    const name = nameMatch[1]!
    i += name.length

    while (i < src.length && /\s/.test(src[i]!)) {
      i++
    }

    if (src[i] !== "(") {
      calls.push({ name, args: [] })
      continue
    }

    i++ // skip (
    let depth = 1
    let quote: "'" | '"' | null = null
    const start = i
    while (i < src.length && depth > 0) {
      const ch = src[i]!
      if (quote) {
        if (ch === quote && src[i - 1] !== "\\") {
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
      if (ch === "(") {
        depth++
      } else if (ch === ")") {
        depth--
        if (depth === 0) {
          break
        }
      }
      i++
    }
    const argsSource = src.slice(start, i)
    i++ // skip )
    calls.push({ name, args: splitArgs(argsSource) })
  }

  return calls
}

function pluralize(word: string): string {
  const lower = word.toLowerCase()
  if (lower.endsWith("y") && lower.length > 1 && !/[aeiou]y$/.test(lower)) {
    return `${word.slice(0, -1)}ies`
  }
  if (
    lower.endsWith("s") ||
    lower.endsWith("x") ||
    lower.endsWith("z") ||
    lower.endsWith("ch") ||
    lower.endsWith("sh")
  ) {
    return `${word}es`
  }
  return `${word}s`
}

function tableFromForeignId(column: string): string {
  const base = column.endsWith("_id") ? column.slice(0, -3) : column
  return pluralize(base)
}

function typeForMethod(method: string): string {
  switch (method) {
    case "id":
    case "bigIncrements":
    case "bigInteger":
    case "unsignedBigInteger":
    case "foreignId":
      return "bigint"
    case "increments":
    case "integer":
    case "tinyInteger":
    case "smallInteger":
    case "mediumInteger":
      return "integer"
    case "string":
    case "char":
    case "rememberToken":
      return "string"
    case "text":
    case "mediumText":
    case "longText":
      return "text"
    case "boolean":
      return "boolean"
    case "uuid":
    case "foreignUuid":
      return "uuid"
    case "ulid":
    case "foreignUlid":
      return "ulid"
    case "json":
    case "jsonb":
      return "json"
    case "float":
    case "double":
      return "float"
    case "decimal":
      return "decimal"
    case "date":
      return "date"
    case "dateTime":
    case "dateTimeTz":
    case "timestamp":
    case "timestampTz":
      return "datetime"
    case "time":
      return "time"
    case "binary":
      return "binary"
    case "enum":
      return "string"
    default:
      return method
  }
}

function applyModifiers(
  column: DraftColumn,
  calls: MethodCall[]
): { onDelete?: ReferentialAction; onUpdate?: ReferentialAction } {
  let onDelete: ReferentialAction | undefined
  let onUpdate: ReferentialAction | undefined

  for (const call of calls) {
    switch (call.name) {
      case "nullable":
        column.nullable = true
        break
      case "unique":
        column.unique = true
        break
      case "default":
        if (call.args[0]) {
          column.default = stripQuotes(call.args[0])
        }
        break
      case "comment":
        if (call.args[0]) {
          column.comment = stripQuotes(call.args[0])
        }
        break
      case "cascadeOnDelete":
        onDelete = "CASCADE"
        break
      case "nullOnDelete":
        onDelete = "SET NULL"
        break
      case "restrictOnDelete":
        onDelete = "RESTRICT"
        break
      case "cascadeOnUpdate":
        onUpdate = "CASCADE"
        break
      case "constrained":
      case "references":
      case "on":
      case "foreign":
        break
      default:
        break
    }
  }

  return { onDelete, onUpdate }
}

function extractConstrainedTable(calls: MethodCall[]): string | undefined {
  const constrained = calls.find((call) => call.name === "constrained")
  if (!constrained) {
    return undefined
  }
  if (constrained.args[0]) {
    return stripQuotes(constrained.args[0])
  }
  return undefined
}

function extractClassicForeign(calls: MethodCall[]): {
  columns: string[]
  referencedTable?: string
  referencedColumn?: string
} | null {
  if (calls[0]?.name !== "foreign") {
    return null
  }
  const columns = calls[0].args.map(stripQuotes).filter(Boolean)
  let referencedTable: string | undefined
  let referencedColumn: string | undefined
  for (const call of calls) {
    if (call.name === "references" && call.args[0]) {
      referencedColumn = stripQuotes(call.args[0])
    }
    if (call.name === "on" && call.args[0]) {
      referencedTable = stripQuotes(call.args[0])
    }
  }
  return { columns, referencedTable, referencedColumn }
}

/** Parse `$table->...` statements inside a Schema create/table closure. */
export function parseBlueprintBody(body: string): BlueprintResult {
  const columns: DraftColumn[] = []
  const foreignKeys: DraftForeignKey[] = []

  const statementRe = /\$table\s*->\s*([\s\S]*?);/g

  for (const match of body.matchAll(statementRe)) {
    const chain = match[1] ?? ""
    const calls = parseMethodCalls(chain)
    if (calls.length === 0) {
      continue
    }

    const head = calls[0]
    if (!head) {
      continue
    }
    const rest = calls.slice(1)

    if (head.name === "foreign") {
      const classic = extractClassicForeign(calls)
      const firstColumn = classic?.columns[0]
      if (classic?.referencedTable && firstColumn) {
        const mods = applyModifiers(
          {
            name: firstColumn,
            typeName: "bigint",
            nullable: false,
          },
          rest
        )
        foreignKeys.push({
          columns: classic.columns,
          referencedTable: classic.referencedTable,
          referencedColumns: [classic.referencedColumn ?? "id"],
          onDelete: mods.onDelete,
          onUpdate: mods.onUpdate,
        })
      }
      continue
    }

    if (MULTI_COLUMN_METHODS.has(head.name)) {
      if (head.name === "timestamps" || head.name === "timestampsTz") {
        columns.push(
          {
            name: "created_at",
            typeName: "datetime",
            nullable: true,
          },
          {
            name: "updated_at",
            typeName: "datetime",
            nullable: true,
          }
        )
      } else if (head.name === "softDeletes" || head.name === "softDeletesTz") {
        const colName = head.args[0] ? stripQuotes(head.args[0]) : "deleted_at"
        columns.push({
          name: colName,
          typeName: "datetime",
          nullable: true,
        })
      } else if (head.name === "rememberToken") {
        columns.push({
          name: "remember_token",
          typeName: "string",
          nullable: true,
        })
      } else if (head.name === "nullableTimestamps") {
        columns.push(
          {
            name: "created_at",
            typeName: "datetime",
            nullable: true,
          },
          {
            name: "updated_at",
            typeName: "datetime",
            nullable: true,
          }
        )
      }
      continue
    }

    if (!COLUMN_METHODS.has(head.name)) {
      continue
    }

    let name: string
    let isPrimaryKey = false
    let idStrategy: IdStrategy | undefined
    const typeName = typeForMethod(head.name)

    if (head.name === "id") {
      name = head.args[0] ? stripQuotes(head.args[0]) : "id"
      isPrimaryKey = true
      idStrategy = "autoincrement"
    } else if (head.name === "bigIncrements" || head.name === "increments") {
      name = head.args[0] ? stripQuotes(head.args[0]) : "id"
      isPrimaryKey = true
      idStrategy = "autoincrement"
    } else if (head.name === "foreignIdFor") {
      // foreignIdFor(User::class) — skip without a clear column name
      continue
    } else {
      name = head.args[0] ? stripQuotes(head.args[0]) : ""
      if (!name) {
        continue
      }
    }

    if (head.name === "uuid" || head.name === "foreignUuid") {
      idStrategy = name === "id" ? "uuid" : idStrategy
    }

    const column: DraftColumn = {
      name,
      typeName,
      nullable: false,
      isPrimaryKey: isPrimaryKey || undefined,
      idStrategy,
    }

    const mods = applyModifiers(column, rest)
    columns.push(column)

    if (
      head.name === "foreignId" ||
      head.name === "foreignUuid" ||
      head.name === "foreignUlid"
    ) {
      const hasConstrained = rest.some((call) => call.name === "constrained")
      const hasReferences = rest.some((call) => call.name === "references")
      if (hasConstrained || hasReferences) {
        const referencedTable =
          extractConstrainedTable(rest) ?? tableFromForeignId(name)
        let referencedColumn = "id"
        const references = rest.find((call) => call.name === "references")
        if (references?.args[0]) {
          referencedColumn = stripQuotes(references.args[0])
        }
        foreignKeys.push({
          columns: [name],
          referencedTable,
          referencedColumns: [referencedColumn],
          onDelete: mods.onDelete,
          onUpdate: mods.onUpdate,
        })
      }
    }

    // constrained without foreignId already handled; classic foreign handled above
  }

  return { columns, foreignKeys }
}
