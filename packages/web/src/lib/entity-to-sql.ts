import type {
  Constraint,
  DatabaseProvider,
  Entity,
  Field,
  FieldId,
  Index,
  SqlDialect,
  UniversalSchema,
} from "@erdflow/core"
import { sqlDialectFromProvider } from "@erdflow/core"
import { resolveIdStrategy } from "../data/field-pills.js"

const IDENT_SAFE = /^[a-z_][a-z0-9_]*$/i

const PRISMA_TYPE_MAP_PG: Record<string, string> = {
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

const PRISMA_TYPE_MAP_MYSQL: Record<string, string> = {
  String: "VARCHAR(255)",
  Int: "INT",
  BigInt: "BIGINT",
  Float: "DOUBLE",
  Decimal: "DECIMAL",
  Boolean: "TINYINT(1)",
  DateTime: "DATETIME",
  Json: "JSON",
  Bytes: "BLOB",
}

const PRISMA_TYPE_MAP_SQLITE: Record<string, string> = {
  String: "TEXT",
  Int: "INTEGER",
  BigInt: "INTEGER",
  Float: "REAL",
  Decimal: "REAL",
  Boolean: "INTEGER",
  DateTime: "TEXT",
  Json: "TEXT",
  Bytes: "BLOB",
}

function quoteIdent(name: string): string {
  if (IDENT_SAFE.test(name)) {
    return name
  }
  return `"${name.replaceAll('"', '""')}"`
}

function typeMapFor(dialect: SqlDialect): Record<string, string> {
  switch (dialect) {
    case "mysql":
      return PRISMA_TYPE_MAP_MYSQL
    case "sqlite":
      return PRISMA_TYPE_MAP_SQLITE
    default:
      return PRISMA_TYPE_MAP_PG
  }
}

function resolveDialect(schema: UniversalSchema): SqlDialect {
  const provider = schema.meta?.provider as DatabaseProvider | undefined
  if (provider) {
    return sqlDialectFromProvider(provider) ?? "postgresql"
  }
  return "postgresql"
}

function resolveSqlType(
  field: Field,
  enumNames: Set<string>,
  dialect: SqlDialect
): string {
  const strategy = resolveIdStrategy(field)

  // App-level string IDs — never emit ObjectId / native DB UUID type blindly.
  if (strategy === "cuid" || strategy === "nanoid") {
    return dialect === "mysql" ? "VARCHAR(255)" : "TEXT"
  }
  if (strategy === "uuid") {
    if (dialect === "postgresql") {
      return "UUID"
    }
    return dialect === "mysql" ? "CHAR(36)" : "TEXT"
  }

  if (field.type.native && field.type.native !== "ObjectId") {
    const base = field.type.native
    return field.type.isArray ? `${base}[]` : base
  }

  const name = field.type.name
  if (enumNames.has(name)) {
    return field.type.isArray ? `${quoteIdent(name)}[]` : quoteIdent(name)
  }

  const mapped = typeMapFor(dialect)[name] ?? name.toUpperCase()
  return field.type.isArray ? `${mapped}[]` : mapped
}

function appIdComment(field: Field): string | null {
  const strategy = resolveIdStrategy(field)
  switch (strategy) {
    case "cuid":
      return "-- @default(cuid())"
    case "nanoid":
      return "-- @default(nanoid())"
    case "uuid":
      // DB-native default handled separately for Postgres
      return null
    default:
      return null
  }
}

function formatDefaultValue(
  field: Field,
  sqlType: string,
  enumNames: Set<string>,
  dialect: SqlDialect
): string | null {
  const strategy = resolveIdStrategy(field)

  // Autoincrement / app generators: no SQL DEFAULT (SERIAL / comment instead).
  if (
    strategy === "autoincrement" ||
    strategy === "cuid" ||
    strategy === "nanoid" ||
    strategy === "objectId" ||
    strategy === "auto"
  ) {
    return null
  }

  if (strategy === "uuid") {
    if (dialect === "postgresql") {
      return "gen_random_uuid()"
    }
    // MySQL/SQLite: app or trigger — annotate via comment, no fake DEFAULT.
    return null
  }

  const raw = field.default
  if (raw == null || raw === "") {
    return null
  }

  const lowered = raw.toLowerCase()
  if (
    lowered === "now()" ||
    lowered.includes('"name":"now"') ||
    lowered === "current_timestamp"
  ) {
    return dialect === "mysql" ? "CURRENT_TIMESTAMP" : "NOW()"
  }

  if (lowered === "true" || lowered === "false" || lowered === "null") {
    return lowered.toUpperCase()
  }

  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    return raw
  }

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

  void sqlType
  return `'${literal.replaceAll("'", "''")}'`
}

function columnDefinition(
  field: Field,
  options: {
    enumNames: Set<string>
    dialect: SqlDialect
    isSinglePrimaryKey: boolean
    hasInlineUnique: boolean
    skipNotNull: boolean
  }
): { sql: string; trailingComment: string | null } {
  const parts: string[] = [quoteIdent(field.name)]
  const strategy = resolveIdStrategy(field)
  let sqlType = resolveSqlType(field, options.enumNames, options.dialect)

  if (
    options.isSinglePrimaryKey &&
    field.isPrimaryKey &&
    strategy === "autoincrement"
  ) {
    if (options.dialect === "postgresql") {
      sqlType =
        sqlType === "BIGINT" || field.type.name === "BigInt"
          ? "BIGSERIAL"
          : "SERIAL"
    } else if (options.dialect === "mysql") {
      // INT AUTO_INCREMENT added below
    } else if (options.dialect === "sqlite") {
      sqlType = "INTEGER"
    }
  }

  parts.push(sqlType)

  if (
    options.isSinglePrimaryKey &&
    field.isPrimaryKey &&
    strategy === "autoincrement" &&
    options.dialect === "mysql"
  ) {
    parts.push("AUTO_INCREMENT")
  }

  if (
    options.isSinglePrimaryKey &&
    field.isPrimaryKey &&
    strategy === "autoincrement" &&
    options.dialect === "sqlite"
  ) {
    parts.push("PRIMARY KEY AUTOINCREMENT")
  } else {
    if (!field.nullable && !options.skipNotNull) {
      parts.push("NOT NULL")
    }

    if (
      options.isSinglePrimaryKey &&
      field.isPrimaryKey &&
      !(strategy === "autoincrement" && options.dialect === "sqlite")
    ) {
      parts.push("PRIMARY KEY")
    }
  }

  if (options.hasInlineUnique && field.isUnique && !field.isPrimaryKey) {
    parts.push("UNIQUE")
  }

  const defaultSql = formatDefaultValue(
    field,
    sqlType,
    options.enumNames,
    options.dialect
  )
  if (defaultSql != null) {
    parts.push(`DEFAULT ${defaultSql}`)
  }

  let trailingComment = appIdComment(field)
  if (
    strategy === "uuid" &&
    options.dialect !== "postgresql" &&
    field.isPrimaryKey
  ) {
    trailingComment = "-- @default(uuid())"
  }

  return { sql: parts.join(" "), trailingComment }
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

  for (const constraint of schema.constraints) {
    if (
      constraint.kind !== "foreign_key" ||
      constraint.entityId !== entity.id
    ) {
      continue
    }

    const fromNames = fieldNames(entity, constraint.fieldIds)
    const refEntity = entityById.get(constraint.referencedEntityId)
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

function formatEnumCreate(
  enumDef: { name: string; values: string[] },
  dialect: SqlDialect
): string {
  const values = enumDef.values
    .map((value) => `'${value.replaceAll("'", "''")}'`)
    .join(", ")
  if (dialect === "postgresql") {
    return `CREATE TYPE ${quoteIdent(enumDef.name)} AS ENUM (${values});`
  }
  // MySQL/SQLite: enums inlined as CHECK / ENUM column — emit as comment.
  return `-- enum ${enumDef.name}: ${values}`
}

function createTableStatement(
  entity: Entity,
  schema: UniversalSchema,
  entityById: Map<string, Entity>,
  enumNames: Set<string>,
  dialect: SqlDialect
): string {
  const pkConstraint = schema.constraints.find(
    (constraint) =>
      constraint.kind === "primary_key" && constraint.entityId === entity.id
  )
  const pkFieldIds = new Set(pkConstraint?.fieldIds ?? [])
  const singlePk =
    pkFieldIds.size === 1 ||
    entity.fields.filter((field) => field.isPrimaryKey).length === 1

  const columnEntries = entity.fields.map((field) => {
    const isPk = field.isPrimaryKey || pkFieldIds.has(field.id)
    const strategy = resolveIdStrategy(field)
    return columnDefinition(field, {
      enumNames,
      dialect,
      isSinglePrimaryKey: singlePk && isPk,
      hasInlineUnique: true,
      skipNotNull:
        singlePk &&
        isPk &&
        strategy === "autoincrement" &&
        dialect === "postgresql",
    })
  })

  const constraintLines = [
    ...tableConstraints(entity, schema.constraints),
    ...foreignKeyClauses(entity, schema, entityById),
  ]

  const allLines: string[] = []
  for (const entry of columnEntries) {
    allLines.push(
      entry.trailingComment
        ? `  ${entry.sql} ${entry.trailingComment}`
        : `  ${entry.sql}`
    )
  }
  for (const line of constraintLines) {
    allLines.push(`  ${line}`)
  }

  const body = allLines
    .map((line, index) =>
      index < allLines.length - 1 && !line.includes(" -- @default")
        ? `${line},`
        : index < allLines.length - 1 && line.includes(" -- @default")
          ? line.replace(/ ( -- @default)/, ",$1")
          : line
    )
    .join("\n")

  return `CREATE TABLE ${quoteIdent(entity.name)} (\n${body}\n);`
}

/**
 * Emit dialect-aware DDL for a single entity (enums, table, indexes).
 * Document databases must use entityToDocument instead.
 */
export function entityToSql(
  schema: UniversalSchema,
  entityId: string
): string | null {
  if (schema.meta?.databaseKind === "document") {
    return null
  }

  const entity = schema.entities.find((entry) => entry.id === entityId)
  if (!entity) {
    return null
  }

  const dialect = resolveDialect(schema)
  const entityById = new Map(schema.entities.map((entry) => [entry.id, entry]))
  const enumNames = new Set(schema.enums.map((entry) => entry.name))
  const usedEnums = enumsUsedByEntity(entity, schema)

  const blocks: string[] = usedEnums.map((enumDef) =>
    formatEnumCreate(enumDef, dialect)
  )
  blocks.push(
    createTableStatement(entity, schema, entityById, enumNames, dialect)
  )

  const indexes = indexStatements(entity, schema.indexes)
  if (indexes.length > 0) {
    blocks.push(indexes.join("\n"))
  }

  return blocks.join("\n\n")
}
