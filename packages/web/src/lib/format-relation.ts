import type { Entity, Relation } from "@erdflow/core"

/** Hover label like "Post To PostCategory" from relation endpoints. */
export function formatRelationLabel(
  relation: Relation,
  entities: Entity[]
): string | null {
  const byId = new Map(entities.map((entity) => [entity.id, entity.name]))
  const fromName = byId.get(relation.from.entityId)
  const toName = byId.get(relation.to.entityId)

  if (fromName && toName) {
    return `${fromName} To ${toName}`
  }

  if (relation.name) {
    return relation.name
  }

  return null
}
