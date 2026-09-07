/** Branded ID aliases for stable graph updates across re-parses. */
export type EntityId = string & { readonly __brand: "EntityId" }
export type FieldId = string & { readonly __brand: "FieldId" }
export type RelationId = string & { readonly __brand: "RelationId" }
export type EnumId = string & { readonly __brand: "EnumId" }
export type IndexId = string & { readonly __brand: "IndexId" }
export type ConstraintId = string & { readonly __brand: "ConstraintId" }

export type EntityKind = "table" | "collection" | "model" | "view"

export type RelationCardinality = "one-to-one" | "one-to-many" | "many-to-many"

export type ConstraintKind = "primary_key" | "foreign_key" | "unique" | "check"

export type ReferentialAction =
  | "CASCADE"
  | "SET NULL"
  | "RESTRICT"
  | "NO ACTION"
  | "SET DEFAULT"

export type SqlDialect = "postgresql" | "mysql" | "sqlite"

/** Prisma / adapter datasource provider (ORM surface, not a live connection). */
export type DatabaseProvider =
  | "postgresql"
  | "mysql"
  | "sqlite"
  | "sqlserver"
  | "cockroachdb"
  | "mongodb"
  | "unknown"

/** Relational (SQL View) vs document (Document View) chrome. */
export type DatabaseKind = "relational" | "document"

/**
 * How a primary / identity field gets its value.
 * App-level generators (cuid, nanoid) are not DB defaults.
 */
export type IdStrategy =
  | "autoincrement"
  | "uuid"
  | "cuid"
  | "nanoid"
  | "objectId"
  | "auto"
  | "none"

export interface FieldType {
  name: string
  native?: string
  isArray?: boolean
}

export interface Field {
  id: FieldId
  name: string
  type: FieldType
  nullable: boolean
  default?: string
  isPrimaryKey?: boolean
  isUnique?: boolean
  /** Structured ID generator when known (parsers set; consumers optional). */
  idStrategy?: IdStrategy
  comment?: string
}

export interface Entity {
  id: EntityId
  name: string
  kind: EntityKind
  fields: Field[]
  comment?: string
}

export interface Enum {
  id: EnumId
  name: string
  values: string[]
}

export interface RelationEndpoint {
  entityId: EntityId
  fieldIds?: FieldId[]
}

export interface Relation {
  id: RelationId
  name?: string
  from: RelationEndpoint
  to: RelationEndpoint
  cardinality: RelationCardinality
  onDelete?: ReferentialAction
  onUpdate?: ReferentialAction
}

export interface Index {
  id: IndexId
  name: string
  entityId: EntityId
  fieldIds: FieldId[]
  unique: boolean
}

export type Constraint =
  | {
      id: ConstraintId
      kind: "primary_key" | "unique"
      entityId: EntityId
      fieldIds: FieldId[]
    }
  | {
      id: ConstraintId
      kind: "foreign_key"
      entityId: EntityId
      fieldIds: FieldId[]
      referencedEntityId: EntityId
      referencedFieldIds: FieldId[]
    }
  | {
      id: ConstraintId
      kind: "check"
      entityId: EntityId
      fieldIds: FieldId[]
      expression: string
    }

export interface SchemaMeta {
  source?: string
  adapter?: string
  /** Active schema version label (e.g. "v1", "2024.1"), when available. */
  version?: string
  /** Available versions for filtering; when length > 1 the UI shows a dropdown. */
  versions?: string[]
  /** Datasource provider (e.g. Prisma `provider = "mongodb"`). */
  provider?: DatabaseProvider
  /** Derived view family: relational → SQL View, document → Document View. */
  databaseKind?: DatabaseKind
}

export interface UniversalSchema {
  entities: Entity[]
  enums: Enum[]
  relations: Relation[]
  indexes: Index[]
  constraints: Constraint[]
  meta?: SchemaMeta
}

const REFERENTIAL_ACTIONS = new Set<string>([
  "CASCADE",
  "SET NULL",
  "RESTRICT",
  "NO ACTION",
  "SET DEFAULT",
])

/** Normalize parser/DBML action strings to the shared union. */
export function normalizeReferentialAction(
  value: string | undefined | null
): ReferentialAction | undefined {
  if (!value) {
    return undefined
  }
  const normalized = value.trim().toUpperCase().replace(/_/g, " ")
  if (REFERENTIAL_ACTIONS.has(normalized)) {
    return normalized as ReferentialAction
  }
  return undefined
}
