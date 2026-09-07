import type { UniversalSchema } from "@erdflow/core"
import { entityNodeDimensions, enumNodeDimensions } from "./node-dimensions.js"

export interface SchemaGraphNode {
  id: string
  kind: "entity" | "enum"
  width: number
  height: number
}

export interface SchemaGraphRelation {
  id: string
  from: string
  to: string
}

/**
 * Undirected projection of a schema for measure / leaf extraction.
 * Parallel or reciprocal relations between the same entity pair collapse
 * to one adjacency for degree.
 */
export interface SchemaGraph {
  nodes: Map<string, SchemaGraphNode>
  /** Entity-only undirected adjacency. */
  neighbors: Map<string, Set<string>>
  relations: SchemaGraphRelation[]
}

function undirectedKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export function buildSchemaGraph(schema: UniversalSchema): SchemaGraph {
  const nodes = new Map<string, SchemaGraphNode>()
  const neighbors = new Map<string, Set<string>>()
  const relations: SchemaGraphRelation[] = []
  const seenPairs = new Set<string>()

  for (const entity of schema.entities) {
    const size = entityNodeDimensions(entity)
    nodes.set(entity.id, {
      id: entity.id,
      kind: "entity",
      width: size.width,
      height: size.height,
    })
    neighbors.set(entity.id, new Set())
  }

  for (const enumDef of schema.enums) {
    const size = enumNodeDimensions(enumDef)
    nodes.set(enumDef.id, {
      id: enumDef.id,
      kind: "enum",
      width: size.width,
      height: size.height,
    })
  }

  for (const relation of schema.relations) {
    const from = relation.from.entityId
    const to = relation.to.entityId
    relations.push({ id: relation.id, from, to })

    if (!neighbors.has(from) || !neighbors.has(to)) {
      continue
    }
    if (from === to) {
      continue
    }

    const key = undirectedKey(from, to)
    if (seenPairs.has(key)) {
      continue
    }
    seenPairs.add(key)

    neighbors.get(from)?.add(to)
    neighbors.get(to)?.add(from)
  }

  return { nodes, neighbors, relations }
}
