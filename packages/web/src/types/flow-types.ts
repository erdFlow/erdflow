import type { Entity, Enum, Relation } from "@erdflow/core";
import type { LayoutPoint } from "@erdflow/layout";

export interface TableNodeData {
  kind: "entity";
  entity: Entity;
  collapsed: boolean;
  [key: string]: unknown;
}

export interface EnumNodeData {
  kind: "enum";
  enumDef: Enum;
  [key: string]: unknown;
}

export type DiagramNodeData = TableNodeData | EnumNodeData;

export interface RelationEdgeData {
  relation: Relation;
  points?: LayoutPoint[];
  [key: string]: unknown;
}
