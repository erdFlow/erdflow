import type { UniversalSchema } from "@erdflow/core"

export function getConnectedIds(
  schema: UniversalSchema,
  entityId: string
): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const nodeIds = new Set<string>([entityId])
  const edgeIds = new Set<string>()

  for (const relation of schema.relations) {
    const fromId = relation.from.entityId
    const toId = relation.to.entityId

    if (fromId === entityId || toId === entityId) {
      edgeIds.add(relation.id)
      nodeIds.add(fromId)
      nodeIds.add(toId)
    }
  }

  return { nodeIds, edgeIds }
}
