import type { UniversalSchema } from "@erdflow/core";
import { defaultLayoutCache } from "./cache.js";
import { getElk } from "./elk.js";
import { fromElkGraph } from "./from-elk.js";
import { schemaTopologyHash } from "./hash.js";
import { toElkGraph } from "./to-elk.js";
import type { LayoutOptions, LayoutResult } from "./types.js";

export async function layoutSchema(
  schema: UniversalSchema,
  options?: LayoutOptions,
): Promise<LayoutResult> {
  const useCache = options?.useCache !== false;
  const cacheKey = schemaTopologyHash(schema);

  if (useCache) {
    const cached = defaultLayoutCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const { graph, nodeKinds } = toElkGraph(schema, options);
  const elk = getElk();
  const laidOut = await elk.layout(graph);
  const result = fromElkGraph(laidOut, nodeKinds);

  if (useCache) {
    defaultLayoutCache.set(cacheKey, result);
  }

  return result;
}
