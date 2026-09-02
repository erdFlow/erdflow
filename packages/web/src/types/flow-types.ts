import type { Entity, Enum, Relation } from "@erdflow/core";
import type { LayoutPoint } from "@erdflow/layout";

export interface TableNodeData {
  kind: "entity";
  entity: Entity;
  collapsed: boolean;
  /**
   * Foreign-key fields of this entity: field id -> "TargetEntity(targetField)".
   * The keys are the set of FK field ids.
   */
  fkRefs: Record<string, string>;
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
  useFieldHandles?: boolean;
  /** Row index of the anchored field in the source table, if known. */
  fromFieldIndex?: number;
  /** Row index of the anchored field in the target table, if known. */
  toFieldIndex?: number;
  [key: string]: unknown;
}
