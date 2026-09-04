import type { ElkNodeKindMap } from "./to-elk.js"
import type {
  LayoutEdge,
  LayoutNode,
  LayoutPoint,
  LayoutResult,
} from "./types.js"

interface ElkPoint {
  x?: number
  y?: number
}

interface ElkEdgeSection {
  startPoint?: ElkPoint
  endPoint?: ElkPoint
  bendPoints?: ElkPoint[]
}

interface ElkLayoutEdge {
  id?: string
  sources?: string[]
  targets?: string[]
  sections?: ElkEdgeSection[]
}

interface ElkLayoutNode {
  id?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

interface ElkLayoutGraph {
  children?: ElkLayoutNode[]
  edges?: ElkLayoutEdge[]
}

function toPoint(point?: ElkPoint): LayoutPoint | undefined {
  if (point?.x === undefined || point?.y === undefined) {
    return undefined
  }
  return { x: point.x, y: point.y }
}

function sectionsToPoints(
  sections?: ElkEdgeSection[]
): LayoutPoint[] | undefined {
  if (!sections || sections.length === 0) {
    return undefined
  }

  const points: LayoutPoint[] = []
  for (const section of sections) {
    const start = toPoint(section.startPoint)
    if (start) {
      points.push(start)
    }

    for (const bendPoint of section.bendPoints ?? []) {
      const point = toPoint(bendPoint)
      if (point) {
        points.push(point)
      }
    }

    const end = toPoint(section.endPoint)
    if (end) {
      points.push(end)
    }
  }

  return points.length > 0 ? points : undefined
}

export function fromElkGraph(
  graph: ElkLayoutGraph,
  nodeKinds: ElkNodeKindMap
): LayoutResult {
  const nodes: LayoutNode[] = (graph.children ?? [])
    .filter((node): node is ElkLayoutNode & { id: string } => Boolean(node.id))
    .map((node) => ({
      id: node.id,
      kind: nodeKinds[node.id] ?? "entity",
      x: node.x ?? 0,
      y: node.y ?? 0,
      width: node.width ?? 0,
      height: node.height ?? 0,
    }))

  const edges: LayoutEdge[] = (graph.edges ?? [])
    .filter((edge): edge is ElkLayoutEdge & { id: string } => Boolean(edge.id))
    .map((edge) => ({
      id: edge.id,
      sourceId: edge.sources?.[0] ?? "",
      targetId: edge.targets?.[0] ?? "",
      points: sectionsToPoints(edge.sections),
    }))
    .filter((edge) => edge.sourceId && edge.targetId)

  return { nodes, edges }
}
