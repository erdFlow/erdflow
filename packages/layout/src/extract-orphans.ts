import type { UniversalSchema } from "@erdflow/core"
import type { SchemaGraph } from "./graph.js"

export interface OrphanExtraction {
  /** Degree-0 entity ids removed from the ELK core (sorted). */
  isolatedEntityIds: string[]
  /** All enum ids removed from the ELK core (sorted). */
  enumIds: string[]
  /** Connected entities only; enums cleared. */
  coreSchema: UniversalSchema
}

/**
 * Peel deg-0 tables and all enums out of the ELK input.
 * Degrees come from the full SchemaGraph so hubs that lost peeled leaves
 * stay in the core (they still had degree ≥ 1 before leaf extraction).
 */
export function extractOrphans(
  schema: UniversalSchema,
  graph: SchemaGraph
): OrphanExtraction {
  const isolatedEntityIds: string[] = []
  for (const entity of schema.entities) {
    const degree = graph.neighbors.get(entity.id)?.size ?? 0
    if (degree === 0) {
      isolatedEntityIds.push(entity.id)
    }
  }
  isolatedEntityIds.sort()

  const enumIds = schema.enums.map((enumDef) => enumDef.id as string).sort()

  if (isolatedEntityIds.length === 0 && enumIds.length === 0) {
    return { isolatedEntityIds, enumIds, coreSchema: schema }
  }

  const isolatedSet = new Set(isolatedEntityIds)
  const coreSchema: UniversalSchema = {
    ...schema,
    entities: schema.entities.filter((entity) => !isolatedSet.has(entity.id)),
    enums: [],
  }

  return { isolatedEntityIds, enumIds, coreSchema }
}
