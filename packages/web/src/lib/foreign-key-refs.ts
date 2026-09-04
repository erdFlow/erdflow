import type { UniversalSchema } from "@erdflow/core"

/**
 * Map of entityId -> { fieldId: "TargetEntity(targetField)" } for every field
 * that is the "from" side of a relation (i.e. a foreign key). The keys double as
 * the set of FK field ids for that entity.
 */
export function foreignKeyRefs(
  schema: UniversalSchema
): Map<string, Record<string, string>> {
  const entityById = new Map(
    schema.entities.map((entity) => [entity.id, entity])
  )
  const out = new Map<string, Record<string, string>>()

  for (const relation of schema.relations) {
    const toEntity = entityById.get(relation.to.entityId)
    const fromIds = relation.from.fieldIds ?? []
    const toIds = relation.to.fieldIds ?? []
    const refs = out.get(relation.from.entityId) ?? {}

    fromIds.forEach((fromId, index) => {
      const toId = toIds[index] ?? toIds[0]
      const toField = toEntity?.fields.find((field) => field.id === toId)
      refs[fromId] = toEntity
        ? `${toEntity.name}(${toField?.name ?? "id"})`
        : ""
    })

    out.set(relation.from.entityId, refs)
  }

  return out
}
