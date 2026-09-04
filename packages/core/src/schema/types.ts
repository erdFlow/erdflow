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
  onDelete?: string
  onUpdate?: string
}

export interface Index {
  id: IndexId
  name: string
  entityId: EntityId
  fieldIds: FieldId[]
  unique: boolean
}

export interface Constraint {
  id: ConstraintId
  kind: ConstraintKind
  entityId: EntityId
  fieldIds: FieldId[]
  expression?: string
  referencedEntityId?: EntityId
  referencedFieldIds?: FieldId[]
}

export interface SchemaMeta {
  source?: string
  adapter?: string
  /** Active schema version label (e.g. "v1", "2024.1"), when available. */
  version?: string
  /** Available versions for filtering; when length > 1 the UI shows a dropdown. */
  versions?: string[]
}

export interface UniversalSchema {
  entities: Entity[]
  enums: Enum[]
  relations: Relation[]
  indexes: Index[]
  constraints: Constraint[]
  meta?: SchemaMeta
}
