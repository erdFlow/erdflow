import type { UniversalSchema } from "@erdflow/core"
import { defaultLayoutCache } from "./cache.js"
import { getElk } from "./elk.js"
import { extractLeaves } from "./extract-leaves.js"
import { fromElkGraph } from "./from-elk.js"
import { buildSchemaGraph } from "./graph.js"
import { schemaTopologyHash } from "./hash.js"
import { placeLeaves } from "./place-leaves.js"
import { toElkGraph } from "./to-elk.js"
import type { LayoutOptions, LayoutResult } from "./types.js"

/**
 * Layout UniversalSchema → positioned nodes/edges.
 * Behind this seam: undirected measure, hub leaf extraction, ELK on the core,
 * then satellite restore. Callers stay on this single entry.
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
  const { coreSchema, groups } = extractLeaves(schema, graph)

  const { graph: elkGraph, nodeKinds } = toElkGraph(coreSchema, options)
  const elk = getElk()
  const laidOut = await elk.layout(elkGraph)
  const core = fromElkGraph(laidOut, nodeKinds)
  const result = placeLeaves(core, schema, groups)

  if (useCache) {
    defaultLayoutCache.set(cacheKey, result)
  }

  return result
}
