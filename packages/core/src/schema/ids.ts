import type {
  ConstraintId,
  ConstraintKind,
  EntityId,
  EnumId,
  FieldId,
  IndexId,
  RelationId,
} from "./types.js"

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function createEntityId(name: string): EntityId {
  return `entity:${normalize(name)}` as EntityId
}

export function createFieldId(entityName: string, fieldName: string): FieldId {
  return `field:${normalize(entityName)}.${normalize(fieldName)}` as FieldId
}

export function createRelationId(
  from: string,
  to: string,
  fields?: string
): RelationId {
  const base = `relation:${normalize(from)}->${normalize(to)}`
  return (fields ? `${base}:${normalize(fields)}` : base) as RelationId
}

export function createEnumId(name: string): EnumId {
  return `enum:${normalize(name)}` as EnumId
}

export function createIndexId(entityName: string, indexName: string): IndexId {
  return `index:${normalize(entityName)}.${normalize(indexName)}` as IndexId
}

export function createConstraintId(
  entityName: string,
  kind: ConstraintKind,
  fieldNames: string[]
): ConstraintId {
  const fields = fieldNames.map(normalize).join(",")
  return `constraint:${normalize(entityName)}.${normalize(kind)}.${fields}` as ConstraintId
}
