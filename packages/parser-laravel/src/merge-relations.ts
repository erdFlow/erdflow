import type { Relation, UniversalSchema } from "@erdflow/core"
import { assertValidSchema } from "@erdflow/core"

function fieldSetKey(fieldIds: readonly string[] | undefined): string {
  return [...(fieldIds ?? [])].sort().join(",")
}

function endpointKey(endpoint: Relation["from"]): string {
  return `${endpoint.entityId}|${fieldSetKey(endpoint.fieldIds)}`
}

/** Same tables + same FK field ids (order-insensitive). */
export function relationsMatch(
  existing: Relation,
  candidate: Relation
): boolean {
  if (
    existing.cardinality === "many-to-many" ||
    candidate.cardinality === "many-to-many"
  ) {
    if (
      existing.cardinality !== "many-to-many" ||
      candidate.cardinality !== "many-to-many"
    ) {
      return false
    }
    const a = [endpointKey(existing.from), endpointKey(existing.to)].sort()
    const b = [endpointKey(candidate.from), endpointKey(candidate.to)].sort()
    return a[0] === b[0] && a[1] === b[1]
  }

  const sameDirection =
    existing.from.entityId === candidate.from.entityId &&
    existing.to.entityId === candidate.to.entityId &&
    fieldSetKey(existing.from.fieldIds) === fieldSetKey(candidate.from.fieldIds)

  const reversed =
    existing.from.entityId === candidate.to.entityId &&
    existing.to.entityId === candidate.from.entityId &&
    fieldSetKey(existing.from.fieldIds) === fieldSetKey(candidate.to.fieldIds)

  return sameDirection || reversed
}

function fieldIdsExist(
  schema: UniversalSchema,
  fieldIds: readonly string[] | undefined
): boolean {
  if (!fieldIds || fieldIds.length === 0) {
    return true
  }
  const known = new Set(
    schema.entities.flatMap((e) => e.fields.map((f) => f.id as string))
  )
  return fieldIds.every((id) => known.has(id))
}

/**
 * Merge Eloquent draft relations into a migration-built schema.
 * Migrations win for columns; Eloquent adds missing edges and may set `name`.
 */
export function mergeEloquentRelations(
  schema: UniversalSchema,
  drafts: Relation[]
): UniversalSchema {
  const entityIds = new Set(schema.entities.map((e) => e.id as string))
  const relations = [...schema.relations]

  for (const draft of drafts) {
    if (
      !entityIds.has(draft.from.entityId) ||
      !entityIds.has(draft.to.entityId)
    ) {
      continue
    }

    if (
      !fieldIdsExist(schema, draft.from.fieldIds) ||
      !fieldIdsExist(schema, draft.to.fieldIds)
    ) {
      continue
    }

    const matchIndex = relations.findIndex((r) => relationsMatch(r, draft))
    if (matchIndex >= 0) {
      const existing = relations[matchIndex]
      if (existing && draft.name && !existing.name) {
        relations[matchIndex] = { ...existing, name: draft.name }
      }
      continue
    }

    relations.push(draft)
  }

  const merged: UniversalSchema = {
    ...schema,
    relations,
  }
  assertValidSchema(merged)
  return merged
}
