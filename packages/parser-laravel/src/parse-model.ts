import { classBasename } from "./naming.js"

export type EloquentRelationKind =
  | "belongsTo"
  | "hasOne"
  | "hasMany"
  | "belongsToMany"

export interface ParsedEloquentRelation {
  methodName: string
  kind: EloquentRelationKind
  relatedModel: string
  /** Optional FK / pivot args as string literals from the call. */
  foreignKey?: string
  ownerKey?: string
  pivotTable?: string
  relatedPivotKey?: string
}

export interface ParsedEloquentModel {
  className: string
  /** Explicit `protected $table` when present. */
  table?: string
  relations: ParsedEloquentRelation[]
}

const RELATION_KINDS = new Set<EloquentRelationKind>([
  "belongsTo",
  "hasOne",
  "hasMany",
  "belongsToMany",
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
    const ch = argsSource[i]
    if (ch === undefined) {
      continue
    }
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

function extractClassName(source: string): string | undefined {
  const match = source.match(/\bclass\s+([A-Za-z_][A-Za-z0-9_]*)\b/)
  return match?.[1]
}

function extractTableProperty(source: string): string | undefined {
  const match = source.match(
    /(?:protected|public)\s+\$table\s*=\s*(['"])([^'"]+)\1/
  )
  return match?.[2]
}

function findArgsEnd(source: string, openParenEnd: number): number {
  let i = openParenEnd
  let depth = 1
  let quote: "'" | '"' | null = null
  while (i < source.length && depth > 0) {
    const ch = source[i]
    if (ch === undefined) {
      break
    }
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
    if (ch === "(") {
      depth++
    } else if (ch === ")") {
      depth--
      if (depth === 0) {
        return i
      }
    }
    i++
  }
  return i
}

/**
 * Parse one Eloquent model PHP file for class, $table, and relation returns.
 */
export function parseEloquentModel(source: string): ParsedEloquentModel | null {
  const className = extractClassName(source)
  if (!className) {
    return null
  }

  const table = extractTableProperty(source)
  const relations: ParsedEloquentRelation[] = []

  const simpleRe =
    /return\s+\$this\s*->\s*(belongsTo|hasOne|hasMany|belongsToMany)\s*\(/g

  let match: RegExpExecArray | null
  while ((match = simpleRe.exec(source)) !== null) {
    const kind = match[1] as EloquentRelationKind
    if (!RELATION_KINDS.has(kind)) {
      continue
    }

    const before = source.slice(0, match.index)
    const methodMatches = [
      ...before.matchAll(/function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g),
    ]
    const methodName = methodMatches[methodMatches.length - 1]?.[1] ?? kind

    const argsStart = match.index + match[0].length
    const argsEnd = findArgsEnd(source, argsStart)
    const argsSource = source.slice(argsStart, argsEnd)
    const args = splitArgs(argsSource)
    const relatedRaw = args[0]
    if (!relatedRaw) {
      continue
    }
    const relatedModel = classBasename(relatedRaw)

    const relation: ParsedEloquentRelation = {
      methodName,
      kind,
      relatedModel,
    }

    if (kind === "belongsToMany") {
      if (args[1] && (args[1].startsWith("'") || args[1].startsWith('"'))) {
        relation.pivotTable = stripQuotes(args[1])
      }
      if (args[2] && (args[2].startsWith("'") || args[2].startsWith('"'))) {
        relation.foreignKey = stripQuotes(args[2])
      }
      if (args[3] && (args[3].startsWith("'") || args[3].startsWith('"'))) {
        relation.relatedPivotKey = stripQuotes(args[3])
      }
    } else {
      if (args[1] && (args[1].startsWith("'") || args[1].startsWith('"'))) {
        relation.foreignKey = stripQuotes(args[1])
      }
      if (args[2] && (args[2].startsWith("'") || args[2].startsWith('"'))) {
        relation.ownerKey = stripQuotes(args[2])
      }
    }

    relations.push(relation)
  }

  return { className, table, relations }
}
