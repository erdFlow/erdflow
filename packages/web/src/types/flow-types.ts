import type { Entity, Enum, Relation } from "@erdflow/core"
import type { LayoutPoint } from "@erdflow/layout"
import type { Edge, Node } from "@xyflow/react"
import type { EdgeKind, NodeKind } from "../data/constants.js"

/** Satisfies xyflow `Record<string, unknown>` without a loose index signature. */
export type TableNodeData = {
  kind: "entity"
  entity: Entity
  collapsed: boolean
  /**
   * Foreign-key fields of this entity: field id -> "TargetEntity(targetField)".
   * The keys are the set of FK field ids.
   */
  fkRefs: Record<string, string>
}

export interface EnumUsageRef {
  table: string
  field: string
}

export type EnumNodeData = {
  kind: "enum"
  enumDef: Enum
  /** Tables/fields that reference this enum by type name. */
  usages: EnumUsageRef[]
}

export type DiagramNodeData = TableNodeData | EnumNodeData

export type RelationEdgeData = {
  relation: Relation
  /** Precomputed hover label (e.g. "Post To User"). */
  label: string | null
  points?: LayoutPoint[]
  useFieldHandles?: boolean
  /** Row index of the anchored field in the source table, if known. */
  fromFieldIndex?: number
  /** Row index of the anchored field in the target table, if known. */
  toFieldIndex?: number
}

export type TableFlowNode = Node<TableNodeData, typeof NodeKind.TABLE>
export type EnumFlowNode = Node<EnumNodeData, typeof NodeKind.ENUM>
export type DiagramFlowNode = TableFlowNode | EnumFlowNode
export type RelationFlowEdge = Edge<RelationEdgeData, typeof EdgeKind.RELATION>
