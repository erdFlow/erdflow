import type { UniversalSchema } from "@erdflow/core";
import type { LayoutOptions } from "./types.js";
import { buildRootLayoutOptions } from "./elk.js";
import {
  entityNodeDimensions,
  enumNodeDimensions,
} from "./node-dimensions.js";

interface ElkNodeInput {
  id: string;
  width: number;
  height: number;
}

interface ElkEdgeInput {
  id: string;
  sources: string[];
  targets: string[];
}

export interface ElkGraphInput {
  id: string;
  layoutOptions: Record<string, string>;
  children: ElkNodeInput[];
  edges: ElkEdgeInput[];
}

export interface ElkNodeKindMap {
  [nodeId: string]: "entity" | "enum";
}

export function toElkGraph(
  schema: UniversalSchema,
  options?: LayoutOptions,
): { graph: ElkGraphInput; nodeKinds: ElkNodeKindMap } {
  const nodeIds = new Set<string>();
  const nodeKinds: ElkNodeKindMap = {};
  const children: ElkNodeInput[] = [];

  for (const entity of schema.entities) {
    nodeIds.add(entity.id);
    nodeKinds[entity.id] = "entity";
    const size = entityNodeDimensions(entity);
    children.push({
      id: entity.id,
      width: size.width,
      height: size.height,
    });
  }

  for (const enumDef of schema.enums) {
    nodeIds.add(enumDef.id);
    nodeKinds[enumDef.id] = "enum";
    const size = enumNodeDimensions(enumDef);
    children.push({
      id: enumDef.id,
      width: size.width,
      height: size.height,
    });
  }

  const edges: ElkEdgeInput[] = [];
  for (const relation of schema.relations) {
    if (
      !nodeIds.has(relation.from.entityId) ||
      !nodeIds.has(relation.to.entityId)
    ) {
      continue;
    }

    edges.push({
      id: relation.id,
      sources: [relation.from.entityId],
      targets: [relation.to.entityId],
    });
  }

  return {
    graph: {
      id: "root",
      layoutOptions: buildRootLayoutOptions(options),
      children,
      edges,
    },
    nodeKinds,
  };
}
