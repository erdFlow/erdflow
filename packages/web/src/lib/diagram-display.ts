import { FOCUS_EDGE_OPACITY, FOCUS_NODE_OPACITY } from "../data/constants.js"
import type { DiagramFlowNode, RelationFlowEdge } from "../types/flow-types.js"

export interface FocusSets {
  nodeIds: Set<string>
  edgeIds: Set<string>
}

export function nodeDisplayName(node: DiagramFlowNode): string {
  return node.data.kind === "entity"
    ? node.data.entity.name
    : node.data.enumDef.name
}

export function nodeMatchesQuery(
  node: DiagramFlowNode,
  query: string
): boolean {
  if (!query) {
    return true
  }
  return nodeDisplayName(node).toLowerCase().includes(query)
}

export function matchingNodeIds(
  nodes: DiagramFlowNode[],
  query: string
): string[] {
  if (!query) {
    return []
  }
  return nodes.filter((node) => nodeMatchesQuery(node, query)).map((n) => n.id)
}

export function buildDisplayNodes(
  nodes: DiagramFlowNode[],
  query: string,
  focusSets: FocusSets | null
): DiagramFlowNode[] {
  const filterByQuery = Boolean(query) && !focusSets

  return nodes.map((node) => {
    const hidden = filterByQuery ? !nodeMatchesQuery(node, query) : false
    let opacity = 1
    if (focusSets && !hidden) {
      opacity = focusSets.nodeIds.has(node.id) ? 1 : FOCUS_NODE_OPACITY
    }

    const currentOpacity = node.style?.opacity ?? 1
    if (node.hidden === hidden && currentOpacity === opacity) {
      return node
    }

    return {
      ...node,
      hidden,
      style: {
        ...node.style,
        opacity,
      },
    }
  })
}

export function buildDisplayEdges(
  edges: RelationFlowEdge[],
  nodes: DiagramFlowNode[],
  query: string,
  focusSets: FocusSets | null,
  showRelations: boolean
): RelationFlowEdge[] {
  const filterByQuery = Boolean(query) && !focusSets
  const visibleIds = filterByQuery
    ? new Set(matchingNodeIds(nodes, query))
    : null

  return edges.map((edge) => {
    let hidden = !showRelations
    if (!hidden && visibleIds) {
      hidden = !visibleIds.has(edge.source) || !visibleIds.has(edge.target)
    }

    let opacity = 1
    if (!hidden && focusSets && showRelations) {
      opacity = focusSets.edgeIds.has(edge.id) ? 1 : FOCUS_EDGE_OPACITY
    }

    const currentOpacity = edge.style?.opacity ?? 1
    if (edge.hidden === hidden && currentOpacity === opacity) {
      return edge
    }

    return {
      ...edge,
      hidden,
      style: {
        ...edge.style,
        opacity,
      },
    }
  })
}
