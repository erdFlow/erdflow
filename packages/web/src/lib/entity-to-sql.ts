import type {
  Constraint,
  Entity,
  Field,
  FieldId,
  Index,
  UniversalSchema,
} from "@erdflow/core"
import { isAutoIncrement } from "../data/field-pills.js"

const IDENT_SAFE = /^[a-z_][a-z0-9_]*$/i

const PRISMA_TYPE_MAP: Record<string, string> = {
  String: "TEXT",
  Int: "INTEGER",
  BigInt: "BIGINT",
  Float: "DOUBLE PRECISION",
  Decimal: "DECIMAL",
  Boolean: "BOOLEAN",
  DateTime: "TIMESTAMP",
  Json: "JSONB",
  Bytes: "BYTEA",
}

function quoteIdent(name: string): string {
  if (IDENT_SAFE.test(name)) {
    return name
  }
  return `"${name.replaceAll('"', '""')}"`
}

function resolveSqlType(field: Field, enumNames: Set<string>): string {
  if (field.type.native) {
    const base = field.type.native
    return field.type.isArray ? `${base}[]` : base
  }

  const name = field.type.name
  if (enumNames.has(name)) {
    return field.type.isArray ? `${quoteIdent(name)}[]` : quoteIdent(name)
  }

  const mapped = PRISMA_TYPE_MAP[name] ?? name.toUpperCase()
  return field.type.isArray ? `${mapped}[]` : mapped
}

function formatDefaultValue(
  field: Field,
  sqlType: string,
  enumNames: Set<string>
): string | null {
  const raw = field.default
  if (raw == null || raw === "") {
    return null
  }

  if (isAutoIncrement(raw)) {
    return null
  }

  const lowered = raw.toLowerCase()
  if (
    lowered === "now()" ||
    lowered.includes('"name":"now"') ||
    lowered === "current_timestamp"
  ) {
    return "NOW()"
  }

  if (lowered === "true" || lowered === "false" || lowered === "null") {
    return lowered.toUpperCase()
  }

  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    return raw
  }

  // Prisma enum / string defaults may be plain or JSON-quoted.
  let literal = raw
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    literal = raw.slice(1, -1)
  }

  if (enumNames.has(field.type.name)) {
    return `'${literal.replaceAll("'", "''")}'`
  }

  if (
    sqlType.includes("CHAR") ||
    sqlType.includes("TEXT") ||
    sqlType.includes("UUID") ||
    sqlType.includes("JSON") ||
    sqlType === "DATE" ||
    sqlType.includes("TIME")
  ) {
    return `'${literal.replaceAll("'", "''")}'`
  }

  return `'${literal.replaceAll("'", "''")}'`
}

function columnDefinition(
  field: Field,
  options: {
    enumNames: Set<string>
    isSinglePrimaryKey: boolean
    hasInlineUnique: boolean
    skipNotNull: boolean
  }
): string {
  const parts: string[] = [quoteIdent(field.name)]
  let sqlType = resolveSqlType(field, options.enumNames)

  if (
    options.isSinglePrimaryKey &&
    field.isPrimaryKey &&
    isAutoIncrement(field.default) &&
    (sqlType === "INTEGER" || sqlType === "INT")
  ) {
    sqlType = "SERIAL"
  } else if (
    options.isSinglePrimaryKey &&
    field.isPrimaryKey &&
    isAutoIncrement(field.default) &&
    sqlType === "BIGINT"
  ) {
    sqlType = "BIGSERIAL"
  }

  parts.push(sqlType)

  if (!field.nullable && !options.skipNotNull) {
    parts.push("NOT NULL")
  }

  if (options.isSinglePrimaryKey && field.isPrimaryKey) {
    parts.push("PRIMARY KEY")
  }

  if (options.hasInlineUnique && field.isUnique && !field.isPrimaryKey) {
    parts.push("UNIQUE")
  }

  const defaultSql = formatDefaultValue(field, sqlType, options.enumNames)
  if (defaultSql != null) {
    parts.push(`DEFAULT ${defaultSql}`)
  }

  return parts.join(" ")
}

function fieldNames(entity: Entity, fieldIds: FieldId[] | undefined): string[] {
  if (!fieldIds?.length) {
    return []
  }
  const byId = new Map(entity.fields.map((field) => [field.id, field.name]))
  return fieldIds
    .map((id) => byId.get(id))
    .filter((name): name is string => Boolean(name))
}

function foreignKeyClauses(
  entity: Entity,
  schema: UniversalSchema,
  entityById: Map<string, Entity>
): string[] {
  const clauses: string[] = []
  const seen = new Set<string>()

  const fkConstraints = schema.constraints.filter(
    (constraint) =>
      constraint.kind === "foreign_key" && constraint.entityId === entity.id
  )

  for (const constraint of fkConstraints) {
    const fromNames = fieldNames(entity, constraint.fieldIds)
    const refEntity = constraint.referencedEntityId
      ? entityById.get(constraint.referencedEntityId)
      : undefined
    if (!refEntity || fromNames.length === 0) {
      continue
    }
    const toNames = fieldNames(refEntity, constraint.referencedFieldIds)
    const key = `${fromNames.join(",")}->${refEntity.id}:${toNames.join(",")}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    clauses.push(formatForeignKey(fromNames, refEntity.name, toNames))
  }

  const relations = schema.relations.filter(
    (relation) => relation.from.entityId === entity.id
  )

  for (const relation of relations) {
    const fromNames = fieldNames(entity, relation.from.fieldIds)
    const refEntity = entityById.get(relation.to.entityId)
    if (!refEntity || fromNames.length === 0) {
      continue
    }
    const toNames = fieldNames(refEntity, relation.to.fieldIds)
    const key = `${fromNames.join(",")}->${refEntity.id}:${toNames.join(",")}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)

    let clause = formatForeignKey(fromNames, refEntity.name, toNames)
    if (relation.onDelete) {
      clause += ` ON DELETE ${relation.onDelete.toUpperCase()}`
    }
    if (relation.onUpdate) {
      clause += ` ON UPDATE ${relation.onUpdate.toUpperCase()}`
    }
    clauses.push(clause)
  }

  return clauses
}

function formatForeignKey(
  fromNames: string[],
  refTable: string,
  toNames: string[]
): string {
  const cols = fromNames.map(quoteIdent).join(", ")
  const refs =
    toNames.length > 0 ? toNames.map(quoteIdent).join(", ") : quoteIdent("id")
  return `FOREIGN KEY (${cols}) REFERENCES ${quoteIdent(refTable)} (${refs})`
}

function tableConstraints(entity: Entity, constraints: Constraint[]): string[] {
  const lines: string[] = []
  const entityConstraints = constraints.filter((c) => c.entityId === entity.id)

  const pk = entityConstraints.find((c) => c.kind === "primary_key")
  const pkNames = fieldNames(entity, pk?.fieldIds)
  if (pkNames.length > 1) {
    lines.push(`PRIMARY KEY (${pkNames.map(quoteIdent).join(", ")})`)
  }

  for (const constraint of entityConstraints) {
    if (constraint.kind !== "unique") {
      continue
    }
    const names = fieldNames(entity, constraint.fieldIds)
    if (names.length === 0) {
      continue
    }
    // Single-field unique is inlined on the column when possible.
    if (names.length === 1) {
      continue
    }
    lines.push(`UNIQUE (${names.map(quoteIdent).join(", ")})`)
  }

  return lines
}

function indexStatements(entity: Entity, indexes: Index[]): string[] {
  return indexes
    .filter((index) => index.entityId === entity.id)
    .map((index) => {
      const cols = fieldNames(entity, index.fieldIds).map(quoteIdent).join(", ")
      if (!cols) {
        return null
      }
      const keyword = index.unique ? "CREATE UNIQUE INDEX" : "CREATE INDEX"
      return `${keyword} ${quoteIdent(index.name)} ON ${quoteIdent(entity.name)} (${cols});`
    })
    .filter((line): line is string => line != null)
}

function enumsUsedByEntity(
  entity: Entity,
  schema: UniversalSchema
): typeof schema.enums {
  const used = new Set(
    entity.fields
      .map((field) => field.type.name)
      .filter((name) => schema.enums.some((e) => e.name === name))
  )
  return schema.enums.filter((enumDef) => used.has(enumDef.name))
}

function formatEnumCreate(enumDef: { name: string; values: string[] }): string {
  const values = enumDef.values
    .map((value) => `'${value.replaceAll("'", "''")}'`)
    .join(", ")
  return `CREATE TYPE ${quoteIdent(enumDef.name)} AS ENUM (${values});`
}

function createTableStatement(
  entity: Entity,
  schema: UniversalSchema,
  entityById: Map<string, Entity>,
  enumNames: Set<string>
): string {
  const pkConstraint = schema.constraints.find(
    (constraint) =>
      constraint.kind === "primary_key" && constraint.entityId === entity.id
  )
  const pkFieldIds = new Set(pkConstraint?.fieldIds ?? [])
  const singlePk =
    pkFieldIds.size === 1 ||
    entity.fields.filter((field) => field.isPrimaryKey).length === 1

  const columnLines = entity.fields.map((field) => {
    const isPk = field.isPrimaryKey || pkFieldIds.has(field.id)
    return `  ${columnDefinition(field, {
      enumNames,
      isSinglePrimaryKey: singlePk && isPk,
      hasInlineUnique: true,
      skipNotNull: singlePk && isPk && isAutoIncrement(field.default),
    })}`
  })

  const constraintLines = [
    ...tableConstraints(entity, schema.constraints),
    ...foreignKeyClauses(entity, schema, entityById),
  ].map((line) => `  ${line}`)

  const body = [...columnLines, ...constraintLines].join(",\n")
  return `CREATE TABLE ${quoteIdent(entity.name)} (\n${body}\n);`
}

/** Emit PostgreSQL-style DDL for a single entity (enums, table, indexes). */
export function entityToSql(
  schema: UniversalSchema,
  entityId: string
): string | null {
  const entity = schema.entities.find((entry) => entry.id === entityId)
  if (!entity) {
    return null
  }

  const entityById = new Map(schema.entities.map((entry) => [entry.id, entry]))
  const enumNames = new Set(schema.enums.map((entry) => entry.name))
  const usedEnums = enumsUsedByEntity(entity, schema)

  const blocks: string[] = usedEnums.map(formatEnumCreate)
  blocks.push(createTableStatement(entity, schema, entityById, enumNames))

  const indexes = indexStatements(entity, schema.indexes)
  if (indexes.length > 0) {
    blocks.push(indexes.join("\n"))
  }

  return blocks.join("\n\n")
}
