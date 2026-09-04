import type {
  Constraint,
  Entity,
  Field,
  Index,
  Relation,
  SchemaMeta,
  UniversalSchema,
  UniversalSchema as UniversalSchemaType,
} from "@erdflow/core"
import {
  assertValidSchema,
  createConstraintId,
  createEntityId,
  createFieldId,
  createIndexId,
  createRelationId,
} from "@erdflow/core"
import sqliteParser from "node-sql-parser/build/sqlite.js"

const { Parser } = sqliteParser

interface SqliteAstNode {
  type?: string
  keyword?: string
  table?: Array<{ table: string }> | { table: string }
  index?: { name?: string }
  index_columns?: Array<{ column?: string }>
  create_definitions?: SqliteColumnDefinition[]
}

interface SqliteColumnDefinition {
  resource?: string
  column?: { column?: string }
  definition?: { dataType?: string } | Array<{ column?: string }>
  primary_key?: string
  unique?: string
  nullable?: { value?: string }
  default_val?: { value?: unknown }
  reference?: unknown
  constraint_type?: string
  reference_definition?: {
    table?: Array<{ table: string }>
    definition?: Array<{ column?: string }>
    on_action?: Array<{ type?: string; value?: { value?: string } }>
  }
}

function tableName(table: SqliteAstNode["table"]): string {
  if (Array.isArray(table)) {
    return table[0]?.table ?? "unknown"
  }
  return table?.table ?? "unknown"
}

function formatDefault(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === "object" && value !== null && "value" in value) {
    const inner = (value as { value?: unknown }).value
    if (typeof inner === "string") {
      return inner
    }
    if (typeof inner === "object" && inner !== null && "value" in inner) {
      return String((inner as { value?: unknown }).value)
    }
  }
  return String(value)
}

function columnDataType(definition: SqliteColumnDefinition): string {
  const value = definition.definition
  if (Array.isArray(value)) {
    return "unknown"
  }
  return value?.dataType ?? "unknown"
}

function fkLocalFields(fk: SqliteColumnDefinition): string[] {
  const value = fk.definition
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((entry) => entry.column)
    .filter((field): field is string => Boolean(field))
}

function mapColumn(table: string, definition: SqliteColumnDefinition): Field {
  const name = definition.column?.column ?? "unknown"
  return {
    id: createFieldId(table, name),
    name,
    type: {
      name: columnDataType(definition),
    },
    nullable: definition.nullable?.value !== "not null",
    default: formatDefault(definition.default_val?.value),
    isPrimaryKey: definition.primary_key === "primary key",
    isUnique: definition.unique === "unique",
  }
}

function mapTableNode(node: SqliteAstNode): {
  entity: Entity
  constraints: Constraint[]
  relations: Relation[]
} {
  const name = tableName(node.table)
  const entityId = createEntityId(name)
  const columns =
    node.create_definitions?.filter(
      (definition) => definition.resource === "column"
    ) ?? []
  const fields = columns.map((column) => mapColumn(name, column))

  const constraints: Constraint[] = []
  const relations: Relation[] = []

  const pkFields = fields.filter((field) => field.isPrimaryKey)
  if (pkFields.length > 0) {
    constraints.push({
      id: createConstraintId(
        name,
        "primary_key",
        pkFields.map((field) => field.name)
      ),
      kind: "primary_key",
      entityId,
      fieldIds: pkFields.map((field) => field.id),
    })
  }

  for (const field of fields) {
    if (field.isUnique) {
      constraints.push({
        id: createConstraintId(name, "unique", [field.name]),
        kind: "unique",
        entityId,
        fieldIds: [field.id],
      })
    }
  }

  const fkConstraints =
    node.create_definitions?.filter(
      (definition) =>
        definition.resource === "constraint" &&
        definition.constraint_type === "FOREIGN KEY"
    ) ?? []

  for (const [index, fk] of fkConstraints.entries()) {
    const localFields = fkLocalFields(fk)
    const refTable = fk.reference_definition?.table?.[0]?.table
    const refFields = (fk.reference_definition?.definition ?? [])
      .map((entry) => entry.column)
      .filter((value): value is string => Boolean(value))

    if (!refTable || localFields.length === 0 || refFields.length === 0) {
      continue
    }

    const onDelete = fk.reference_definition?.on_action?.find((action) =>
      action.type?.includes("delete")
    )?.value?.value

    relations.push({
      id: createRelationId(
        refTable,
        name,
        `${refFields.join(",")}->${localFields.join(",")}`
      ),
      name: `fk_${name}_${index}`,
      from: {
        entityId: createEntityId(refTable),
        fieldIds: refFields.map((fieldName) =>
          createFieldId(refTable, fieldName)
        ),
      },
      to: {
        entityId: entityId,
        fieldIds: localFields.map((fieldName) =>
          createFieldId(name, fieldName)
        ),
      },
      cardinality: "one-to-many",
      onDelete,
    })

    constraints.push({
      id: createConstraintId(name, "foreign_key", localFields),
      kind: "foreign_key",
      entityId,
      fieldIds: localFields.map((fieldName) => createFieldId(name, fieldName)),
      referencedEntityId: createEntityId(refTable),
      referencedFieldIds: refFields.map((fieldName) =>
        createFieldId(refTable, fieldName)
      ),
    })
  }

  return {
    entity: {
      id: entityId,
      name,
      kind: "table",
      fields,
    },
    constraints,
    relations,
  }
}

function mapIndexNode(node: SqliteAstNode): Index | null {
  if (!node.index?.name) {
    return null
  }

  const entityName = tableName(node.table)
  const columns =
    node.index_columns
      ?.map((column) => column.column)
      .filter((value): value is string => Boolean(value)) ?? []

  return {
    id: createIndexId(entityName, node.index.name),
    name: node.index.name,
    entityId: createEntityId(entityName),
    fieldIds: columns.map((columnName) =>
      createFieldId(entityName, columnName)
    ),
    unique: false,
  }
}

export function parseSqliteSql(
  input: string,
  meta?: SchemaMeta
): UniversalSchema {
  const parser = new Parser()
  const ast = parser.astify(input) as SqliteAstNode | SqliteAstNode[]
  const nodes = Array.isArray(ast) ? ast : [ast]

  const entities: Entity[] = []
  const relations: Relation[] = []
  const indexes: Index[] = []
  const constraints: Constraint[] = []

  for (const node of nodes) {
    if (node.type === "create" && node.keyword === "table") {
      const mapped = mapTableNode(node)
      entities.push(mapped.entity)
      relations.push(...mapped.relations)
      constraints.push(...mapped.constraints)
    }

    if (node.type === "create" && node.keyword === "index") {
      const index = mapIndexNode(node)
      if (index) {
        indexes.push(index)
      }
    }
  }

  const schema: UniversalSchemaType = {
    entities,
    enums: [],
    relations,
    indexes,
    constraints,
    meta,
  }

  assertValidSchema(schema)
  return schema
}
