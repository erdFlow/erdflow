import type { Entity, EntityId, Enum, UniversalSchema } from "@erdflow/core"
import {
  ENTITY_HEADER_HEIGHT,
  ENTITY_NODE_WIDTH,
  ENUM_NODE_WIDTH,
  type LayoutResult,
} from "@erdflow/layout"
import { EdgeKind, NodeKind } from "../data/constants.js"
import type {
  DiagramFlowNode,
  RelationEdgeData,
  RelationFlowEdge,
} from "../types/flow-types.js"
import { enumUsages } from "./enum-usages.js"
import { foreignKeyRefs } from "./foreign-key-refs.js"
import { entityNameByIdMap, formatRelationLabel } from "./format-relation.js"
import { entityNodeHeight, enumNodeHeight } from "./node-dimensions.js"
import { resolveRelationHandles } from "./relation-handles.js"

interface BuildFlowGraphOptions {
  schema: UniversalSchema
  layout: LayoutResult
  manualPositions: Record<string, { x: number; y: number }>
  collapsedTables: Partial<Record<EntityId, boolean>>
}

export function schemaToFlow({
  schema,
  layout,
  manualPositions,
  collapsedTables,
}: BuildFlowGraphOptions): {
  nodes: DiagramFlowNode[]
  edges: RelationFlowEdge[]
} {
  const fkRefsByEntity = foreignKeyRefs(schema)
  const layoutNodeMap = new Map(layout.nodes.map((node) => [node.id, node]))
  const layoutEdgeMap = new Map(layout.edges.map((edge) => [edge.id, edge]))
  const entityById = new Map(
    schema.entities.map((entity) => [entity.id, entity])
  )
  const nameById = entityNameByIdMap(schema.entities)
  const nodes: DiagramFlowNode[] = []

  for (const entity of schema.entities) {
    const layoutNode = layoutNodeMap.get(entity.id)
    const collapsed = collapsedTables[entity.id] ?? false
    const manual = manualPositions[entity.id]

    nodes.push({
      id: entity.id,
      type: NodeKind.TABLE,
      position: manual ?? {
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0,
      },
      data: {
        kind: "entity",
        entity,
        collapsed,
        fkRefs: fkRefsByEntity.get(entity.id) ?? {},
      },
      style: {
        width: layoutNode?.width ?? ENTITY_NODE_WIDTH,
        height: collapsed
          ? ENTITY_HEADER_HEIGHT
          : (layoutNode?.height ?? entityNodeHeight(entity)),
      },
    })
  }

  for (const enumDef of schema.enums) {
    const layoutNode = layoutNodeMap.get(enumDef.id)
    const manual = manualPositions[enumDef.id]

    nodes.push({
      id: enumDef.id,
      type: NodeKind.ENUM,
      position: manual ?? {
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0,
      },
      data: {
        kind: "enum",
        enumDef,
        usages: enumUsages(schema, enumDef.name),
      },
      style: {
        width: layoutNode?.width ?? ENUM_NODE_WIDTH,
        height: layoutNode?.height ?? enumNodeHeight(enumDef),
      },
    })
  }

  const edges: RelationFlowEdge[] = schema.relations.map((relation) => {
    const layoutEdge = layoutEdgeMap.get(relation.id)
    const handles = resolveRelationHandles(relation, entityById)
    const data: RelationEdgeData = {
      relation,
      label: formatRelationLabel(relation, nameById),
      points: layoutEdge?.points,
      useFieldHandles: false,
      fromFieldIndex: handles.fromFieldIndex,
      toFieldIndex: handles.toFieldIndex,
    }

    return {
      id: relation.id,
      type: EdgeKind.RELATION,
      source: relation.from.entityId,
      target: relation.to.entityId,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      data,
    }
  })

  return { nodes, edges }
}

export function updateFlowData(
  schema: UniversalSchema,
  nodes: DiagramFlowNode[],
  collapsedTables: Partial<Record<EntityId, boolean>>
): DiagramFlowNode[] {
  const entityMap = new Map(
    schema.entities.map((entity) => [entity.id, entity])
  )
  const enumMap = new Map(schema.enums.map((enumDef) => [enumDef.id, enumDef]))
  const fkRefsByEntity = foreignKeyRefs(schema)

  const nextNodes: DiagramFlowNode[] = []

  for (const node of nodes) {
    const entity = entityMap.get(node.id as Entity["id"])
    if (entity) {
      const collapsed = collapsedTables[entity.id] ?? false
      nextNodes.push({
        ...node,
        type: NodeKind.TABLE,
        data: {
          kind: "entity",
          entity,
          collapsed,
          fkRefs: fkRefsByEntity.get(entity.id) ?? {},
        },
        style: {
          ...node.style,
          height: collapsed ? ENTITY_HEADER_HEIGHT : entityNodeHeight(entity),
        },
      })
      continue
    }

    const enumDef = enumMap.get(node.id as Enum["id"])
    if (enumDef) {
      nextNodes.push({
        ...node,
        type: NodeKind.ENUM,
        data: {
          kind: "enum",
          enumDef,
          usages: enumUsages(schema, enumDef.name),
        },
      })
    }
  }

  return nextNodes
}
