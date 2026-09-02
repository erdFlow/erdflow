import type { Entity, Enum, UniversalSchema } from "@erdflow/core";
import {
  ENTITY_HEADER_HEIGHT,
  ENTITY_NODE_WIDTH,
  ENUM_NODE_WIDTH,
  type LayoutResult,
} from "@erdflow/layout";
import type { Edge, Node } from "@xyflow/react";
import type { RelationEdgeData } from "../types/flow-types.js";
import { entityNodeHeight, enumNodeHeight } from "./node-dimensions.js";
import { resolveRelationHandles } from "./relation-handles.js";

interface BuildFlowGraphOptions {
  schema: UniversalSchema;
  layout: LayoutResult;
  manualPositions: Record<string, { x: number; y: number }>;
  collapsedTables: Record<string, boolean>;
}

/**
 * Map of entityId -> { fieldId: "TargetEntity(targetField)" } for every field
 * that is the "from" side of a relation (i.e. a foreign key). The keys double as
 * the set of FK field ids for that entity.
 */
export function foreignKeyRefs(
  schema: UniversalSchema,
): Map<string, Record<string, string>> {
  const entityById = new Map(schema.entities.map((entity) => [entity.id, entity]));
  const out = new Map<string, Record<string, string>>();

  for (const relation of schema.relations) {
    const toEntity = entityById.get(relation.to.entityId);
    const fromIds = relation.from.fieldIds ?? [];
    const toIds = relation.to.fieldIds ?? [];
    const refs = out.get(relation.from.entityId) ?? {};

    fromIds.forEach((fromId, index) => {
      const toId = toIds[index] ?? toIds[0];
      const toField = toEntity?.fields.find((field) => field.id === toId);
      refs[fromId] = toEntity
        ? `${toEntity.name}(${toField?.name ?? "id"})`
        : "";
    });

    out.set(relation.from.entityId, refs);
  }

  return out;
}

export function schemaToFlow({
  schema,
  layout,
  manualPositions,
  collapsedTables,
}: BuildFlowGraphOptions): { nodes: Node[]; edges: Edge[] } {
  const fkRefsByEntity = foreignKeyRefs(schema);
  const layoutNodeMap = new Map(layout.nodes.map((node) => [node.id, node]));
  const layoutEdgeMap = new Map(layout.edges.map((edge) => [edge.id, edge]));
  const nodes: Node[] = [];

  for (const entity of schema.entities) {
    const layoutNode = layoutNodeMap.get(entity.id);
    const collapsed = collapsedTables[entity.id] ?? false;
    const manual = manualPositions[entity.id];

    nodes.push({
      id: entity.id,
      type: "table",
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
    });
  }

  for (const enumDef of schema.enums) {
    const layoutNode = layoutNodeMap.get(enumDef.id);
    const manual = manualPositions[enumDef.id];

    nodes.push({
      id: enumDef.id,
      type: "enum",
      position: manual ?? {
        x: layoutNode?.x ?? 0,
        y: layoutNode?.y ?? 0,
      },
      data: {
        kind: "enum",
        enumDef,
      },
      style: {
        width: layoutNode?.width ?? ENUM_NODE_WIDTH,
        height: layoutNode?.height ?? enumNodeHeight(enumDef),
      },
    });
  }

  const edges: Edge<RelationEdgeData>[] = schema.relations.map((relation) => {
    const layoutEdge = layoutEdgeMap.get(relation.id);
    const handles = resolveRelationHandles(schema, relation);

    return {
      id: relation.id,
      type: "relation",
      source: relation.from.entityId,
      target: relation.to.entityId,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      data: {
        relation,
        points: layoutEdge?.points,
        useFieldHandles: false,
        fromFieldIndex: handles.fromFieldIndex,
        toFieldIndex: handles.toFieldIndex,
      },
    };
  });

  return { nodes, edges };
}

export function updateFlowData(
  schema: UniversalSchema,
  nodes: Node[],
  collapsedTables: Record<string, boolean>,
): Node[] {
  const entityMap = new Map(schema.entities.map((entity) => [entity.id, entity]));
  const enumMap = new Map(schema.enums.map((enumDef) => [enumDef.id, enumDef]));
  const fkRefsByEntity = foreignKeyRefs(schema);

  const nextNodes: Node[] = [];

  for (const node of nodes) {
    const entity = entityMap.get(node.id as Entity["id"]);
    if (entity) {
      const collapsed = collapsedTables[node.id] ?? false;
      nextNodes.push({
        ...node,
        data: {
          kind: "entity" as const,
          entity,
          collapsed,
          fkRefs: fkRefsByEntity.get(node.id) ?? {},
        },
        style: {
          ...node.style,
          height: collapsed ? ENTITY_HEADER_HEIGHT : entityNodeHeight(entity),
        },
      });
      continue;
    }

    const enumDef = enumMap.get(node.id as Enum["id"]);
    if (enumDef) {
      nextNodes.push({
        ...node,
        data: {
          kind: "enum" as const,
          enumDef,
        },
      });
    }
  }

  return nextNodes;
}
