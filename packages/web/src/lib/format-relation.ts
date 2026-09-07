import type { Entity, EntityId, Relation } from "@erdflow/core"

/** Hover label like "Post To PostCategory" from relation endpoints. */
export function formatRelationLabel(
  relation: Relation,
  entityNameById: ReadonlyMap<EntityId, string>
): string | null {
  const fromName = entityNameById.get(relation.from.entityId)
  const toName = entityNameById.get(relation.to.entityId)

  if (fromName && toName) {
    return `${fromName} To ${toName}`
  }

  if (relation.name) {
    return relation.name
  }

  return null
}

export function entityNameByIdMap(entities: Entity[]): Map<EntityId, string> {
  return new Map(entities.map((entity) => [entity.id, entity.name]))
}
