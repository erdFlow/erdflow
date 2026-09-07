import type { UniversalSchema } from "@erdflow/core"
import type { SchemaGraph } from "./graph.js"
import { measureGraph } from "./measure.js"

export interface SatelliteGroup {
  hubId: string
  leafIds: string[]
}

export interface LeafExtraction {
  /** Entity ids removed from the core layout graph. */
  removedIds: Set<string>
  groups: SatelliteGroup[]
  coreSchema: UniversalSchema
}

const MIN_SATELLITE_GROUP = 3

/**
 * Peel exclusive deg-1 leaves off hubs (≥3 per hub) so ELK lays out a smaller core.
 */
export function extractLeaves(
  schema: UniversalSchema,
  graph: SchemaGraph
): LeafExtraction {
  const metrics = measureGraph(graph)
  const removedIds = new Set<string>()
  const groups: SatelliteGroup[] = []

  for (const hubId of metrics.hubs) {
    const leafIds: string[] = []
    const offs = graph.neighbors.get(hubId)
    if (!offs) {
      continue
    }

    for (const neighborId of offs) {
      if (!metrics.leaves.has(neighborId)) {
        continue
      }
      const neighborOffs = graph.neighbors.get(neighborId)
      if (neighborOffs?.size !== 1) {
        continue
      }
      if (!neighborOffs.has(hubId)) {
        continue
      }
      leafIds.push(neighborId)
    }

    if (leafIds.length < MIN_SATELLITE_GROUP) {
      continue
    }

    leafIds.sort()
    for (const leafId of leafIds) {
      removedIds.add(leafId)
    }
    groups.push({ hubId, leafIds })
  }

  if (removedIds.size === 0) {
    return { removedIds, groups, coreSchema: schema }
  }

  const coreSchema: UniversalSchema = {
    ...schema,
    entities: schema.entities.filter((entity) => !removedIds.has(entity.id)),
    relations: schema.relations.filter(
      (relation) =>
        !removedIds.has(relation.from.entityId) &&
        !removedIds.has(relation.to.entityId)
    ),
  }

  return { removedIds, groups, coreSchema }
}
