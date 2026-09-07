import type { UniversalSchema } from "@erdflow/core"
import { defaultLayoutCache } from "./cache.js"
import { getElk } from "./elk.js"
import { extractLeaves } from "./extract-leaves.js"
import { extractOrphans } from "./extract-orphans.js"
import { fromElkGraph } from "./from-elk.js"
import { buildSchemaGraph } from "./graph.js"
import { schemaTopologyHash } from "./hash.js"
import { placeLeaves } from "./place-leaves.js"
import { placeOrphans } from "./place-orphans.js"
import { toElkGraph } from "./to-elk.js"
import type { LayoutOptions, LayoutResult } from "./types.js"

/**
 * Layout UniversalSchema → positioned nodes/edges.
 * Behind this seam: undirected measure, hub leaf extraction, orphan/enum
 * peel, ELK on the connected core, then satellite + orphan-band restore.
 */
export async function layoutSchema(
  schema: UniversalSchema,
  options?: LayoutOptions
): Promise<LayoutResult> {
  const useCache = options?.useCache !== false
  const cacheKey = schemaTopologyHash(schema)

  if (useCache) {
    const cached = defaultLayoutCache.get(cacheKey)
    if (cached) {
      return cached
    }
  }

  const graph = buildSchemaGraph(schema)
  const { coreSchema: afterLeaves, groups } = extractLeaves(schema, graph)
  const { coreSchema, isolatedEntityIds, enumIds } = extractOrphans(
    afterLeaves,
    graph
  )

  let core: LayoutResult
  if (coreSchema.entities.length === 0) {
    core = { nodes: [], edges: [] }
  } else {
    const { graph: elkGraph, nodeKinds } = toElkGraph(coreSchema, options)
    const elk = getElk()
    const laidOut = await elk.layout(elkGraph)
    core = fromElkGraph(laidOut, nodeKinds)
  }

  const withLeaves = placeLeaves(core, schema, groups)
  const result = placeOrphans(withLeaves, schema, isolatedEntityIds, enumIds)

  if (useCache) {
    defaultLayoutCache.set(cacheKey, result)
  }

  return result
}
