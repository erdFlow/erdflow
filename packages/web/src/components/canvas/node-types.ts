import { EnumNode } from "./EnumNode.js"
import { RelationEdge } from "./RelationEdge.js"
import { TableNode } from "./TableNode.js"

export const nodeTypes = {
  table: TableNode,
  enum: EnumNode,
}

export const edgeTypes = {
  relation: RelationEdge,
}
