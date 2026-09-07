import type {
  Entity,
  EntityId,
  Enum,
  Relation,
  UniversalSchema,
} from "@erdflow/core"
import { layoutSchema, schemaTopologyHash } from "@erdflow/layout"
import type {
  DiagramFlowNode,
  RelationEdgeData,
  RelationFlowEdge,
} from "../types/flow-types.js"
import { entityNameByIdMap, formatRelationLabel } from "./format-relation.js"
import { resolveRelationHandles } from "./relation-handles.js"
import { schemaToFlow, updateFlowData } from "./schema-to-flow.js"

export interface MergeSchemaOptions {
  previousSchema: UniversalSchema | null
  previousNodes: DiagramFlowNode[]
  previousEdges: RelationFlowEdge[]
  manualPositions: Record<string, { x: number; y: number }>
  collapsedTables: Partial<Record<EntityId, boolean>>
}

export interface MergeSchemaResult {
  nodes: DiagramFlowNode[]
  edges: RelationFlowEdge[]
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

  const relationById = new Map(
    schema.relations.map((relation) => [relation.id, relation])
  )
  const entityById = new Map(
    schema.entities.map((entity) => [entity.id, entity])
  )
  const nameById = entityNameByIdMap(schema.entities)
  const entityIds = new Set([
    ...schema.entities.map((entity) => entity.id),
    ...schema.enums.map((enumDef) => enumDef.id),
  ])

  const nodes = updatedNodes.filter((node) =>
    entityIds.has(node.id as Entity["id"] | Enum["id"])
  )
  const edges = options.previousEdges
    .filter((edge) => relationById.has(edge.id as Relation["id"]))
    .map((edge) => {
      const relation = relationById.get(edge.id as Relation["id"])
      if (!relation) {
        return edge
      }

      const handles = resolveRelationHandles(relation, entityById)
      const data: RelationEdgeData = {
        relation,
        label: formatRelationLabel(relation, nameById),
        useFieldHandles: false,
        fromFieldIndex: handles.fromFieldIndex,
        toFieldIndex: handles.toFieldIndex,
        points: edge.data?.points,
      }

      return {
        ...edge,
        source: relation.from.entityId,
        target: relation.to.entityId,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        data,
      }
    })

  return {
    nodes,
    edges,
    topologyChanged: false,
  }
}
