import type { Edge, Node } from "@xyflow/react"
import {
  FOCUS_EDGE_OPACITY,
  FOCUS_NODE_OPACITY,
} from "../data/constants.js"
import type { DiagramNodeData } from "../types/flow-types.js"

export interface FocusSets {
  nodeIds: Set<string>
  edgeIds: Set<string>
}

export function nodeDisplayName(node: Node): string {
  const data = node.data as DiagramNodeData
  return data.kind === "entity" ? data.entity.name : data.enumDef.name
}

export function nodeMatchesQuery(node: Node, query: string): boolean {
  if (!query) {
    return true
  }
  return nodeDisplayName(node).toLowerCase().includes(query)
}

export function matchingNodeIds(nodes: Node[], query: string): string[] {
  if (!query) {
    return []
  }
  return nodes.filter((node) => nodeMatchesQuery(node, query)).map((n) => n.id)
}

export function buildDisplayNodes(
  nodes: Node[],
  query: string,
  focusSets: FocusSets | null
): Node[] {
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
  edges: Edge[],
  nodes: Node[],
  query: string,
  focusSets: FocusSets | null,
  showRelations: boolean
): Edge[] {
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
