import type { Entity, Enum, Relation, UniversalSchema } from "@erdflow/core"
import { layoutSchema, schemaTopologyHash } from "@erdflow/layout"
import type { Edge, Node } from "@xyflow/react"
import type { RelationEdgeData } from "../types/flow-types.js"
import { resolveRelationHandles } from "./relation-handles.js"
import { schemaToFlow, updateFlowData } from "./schema-to-flow.js"

export interface MergeSchemaOptions {
  previousSchema: UniversalSchema | null
  previousNodes: Node[]
  previousEdges: Edge[]
  manualPositions: Record<string, { x: number; y: number }>
  collapsedTables: Record<string, boolean>
}

export interface MergeSchemaResult {
  nodes: Node[]
  edges: Edge[]
  topologyChanged: boolean
}

export async function mergeSchemaUpdate(
  schema: UniversalSchema,
  options: MergeSchemaOptions
): Promise<MergeSchemaResult> {
  const previousHash = options.previousSchema
    ? schemaTopologyHash(options.previousSchema)
    : null
  const nextHash = schemaTopologyHash(schema)
  const topologyChanged = previousHash !== nextHash

  if (
    !options.previousSchema ||
    topologyChanged ||
    options.previousNodes.length === 0
  ) {
    const layout = await layoutSchema(schema)
    const graph = schemaToFlow({
      schema,
      layout,
      manualPositions: options.manualPositions,
      collapsedTables: options.collapsedTables,
    })

    return {
      nodes: graph.nodes,
      edges: graph.edges,
      topologyChanged,
    }
  }

  const updatedNodes = updateFlowData(
    schema,
    options.previousNodes,
    options.collapsedTables
  )

  const relationIds = new Set(schema.relations.map((relation) => relation.id))
  const entityIds = new Set([
    ...schema.entities.map((entity) => entity.id),
    ...schema.enums.map((enumDef) => enumDef.id),
  ])

  const nodes = updatedNodes.filter((node) =>
    entityIds.has(node.id as Entity["id"] | Enum["id"])
  )
  const edges = options.previousEdges
    .filter((edge) => relationIds.has(edge.id as Relation["id"]))
    .map((edge) => {
      const relation = schema.relations.find(
        (candidate) => candidate.id === edge.id
      )
      if (!relation) {
        return edge
      }

      const handles = resolveRelationHandles(schema, relation)

      return {
        ...edge,
        source: relation.from.entityId,
        target: relation.to.entityId,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        data: {
          ...(edge.data as Record<string, unknown>),
          relation,
          useFieldHandles: false,
          fromFieldIndex: handles.fromFieldIndex,
          toFieldIndex: handles.toFieldIndex,
          points: (edge.data as RelationEdgeData | undefined)?.points,
        },
      }
    })

  return {
    nodes,
    edges,
    topologyChanged: false,
  }
}
