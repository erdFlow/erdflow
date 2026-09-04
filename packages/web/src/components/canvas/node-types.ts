import { EdgeKind, NodeKind } from "../../data/constants.js"
import { EnumNode } from "./EnumNode.js"
import { RelationEdge } from "./RelationEdge.js"
import { TableNode } from "./TableNode.js"

export const nodeTypes = {
  [NodeKind.TABLE]: TableNode,
  [NodeKind.ENUM]: EnumNode,
}

export const edgeTypes = {
  [EdgeKind.RELATION]: RelationEdge,
}
