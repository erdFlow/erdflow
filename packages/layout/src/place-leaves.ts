import type { UniversalSchema } from "@erdflow/core"
import type { SatelliteGroup } from "./extract-leaves.js"
import { entityNodeDimensions } from "./node-dimensions.js"
import type { LayoutEdge, LayoutNode, LayoutResult } from "./types.js"

type Side = "left" | "right" | "top" | "bottom"

const GRID_GAP = 40

function pickFreeSide(
  hub: LayoutNode,
  nodesById: Map<string, LayoutNode>,
  edges: LayoutEdge[]
): Side {
  const counts: Record<Side, number> = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }

  const hubCx = hub.x + hub.width / 2
  const hubCy = hub.y + hub.height / 2

  for (const edge of edges) {
    let otherId: string | undefined
    if (edge.sourceId === hub.id) {
      otherId = edge.targetId
    } else if (edge.targetId === hub.id) {
      otherId = edge.sourceId
    }
    if (!otherId) {
      continue
    }

    const other = nodesById.get(otherId)
    if (!other) {
      continue
    }

    const dx = other.x + other.width / 2 - hubCx
    const dy = other.y + other.height / 2 - hubCy
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx >= 0) {
        counts.right += 1
      } else {
        counts.left += 1
      }
    } else if (dy >= 0) {
      counts.bottom += 1
    } else {
      counts.top += 1
    }
  }

  let best: Side = "right"
  let bestCount = Number.POSITIVE_INFINITY
  for (const side of ["right", "left", "bottom", "top"] as const) {
    if (counts[side] < bestCount) {
      best = side
      bestCount = counts[side]
    }
  }
  return best
}

function placeGrid(
  hub: LayoutNode,
  side: Side,
  leafSizes: Array<{ id: string; width: number; height: number }>
): LayoutNode[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(leafSizes.length)))
  const rows = Math.ceil(leafSizes.length / cols)

  const colWidths: number[] = Array.from({ length: cols }, () => 0)
  const rowHeights: number[] = Array.from({ length: rows }, () => 0)

  for (let i = 0; i < leafSizes.length; i += 1) {
    const leaf = leafSizes[i]
    if (!leaf) continue
    const col = i % cols
    const row = Math.floor(i / cols)
    colWidths[col] = Math.max(colWidths[col] ?? 0, leaf.width)
    rowHeights[row] = Math.max(rowHeights[row] ?? 0, leaf.height)
  }

  const gridWidth =
    colWidths.reduce((sum, w) => sum + w, 0) + GRID_GAP * Math.max(0, cols - 1)
  const gridHeight =
    rowHeights.reduce((sum, h) => sum + h, 0) + GRID_GAP * Math.max(0, rows - 1)

  let originX = hub.x
  let originY = hub.y

  switch (side) {
    case "right":
      originX = hub.x + hub.width + GRID_GAP
      originY = hub.y + (hub.height - gridHeight) / 2
      break
    case "left":
      originX = hub.x - GRID_GAP - gridWidth
      originY = hub.y + (hub.height - gridHeight) / 2
      break
    case "bottom":
      originX = hub.x + (hub.width - gridWidth) / 2
      originY = hub.y + hub.height + GRID_GAP
      break
    case "top":
      originX = hub.x + (hub.width - gridWidth) / 2
      originY = hub.y - GRID_GAP - gridHeight
      break
  }

  const placed: LayoutNode[] = []
  let y = originY
  for (let row = 0; row < rows; row += 1) {
    let x = originX
    const rowHeight = rowHeights[row] ?? 0
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col
      const leaf = leafSizes[index]
      const colWidth = colWidths[col] ?? 0
      if (leaf) {
        placed.push({
          id: leaf.id,
          kind: "entity",
          x,
          y,
          width: leaf.width,
          height: leaf.height,
        })
      }
      x += colWidth + GRID_GAP
    }
    y += rowHeight + GRID_GAP
  }

  return placed
}

/**
 * Restore extracted satellite leaves beside their hub and reattach leaf edges.
 */
export function placeLeaves(
  core: LayoutResult,
  schema: UniversalSchema,
  groups: SatelliteGroup[]
): LayoutResult {
  if (groups.length === 0) {
    return core
  }

  const nodesById = new Map(core.nodes.map((node) => [node.id, node]))
  const entityById = new Map(
    schema.entities.map((entity) => [entity.id as string, entity])
  )
  const nodes = [...core.nodes]
  const edges = [...core.edges]
  const placedLeafIds = new Set<string>()

  for (const group of groups) {
    const hub = nodesById.get(group.hubId)
    if (!hub) {
      continue
    }

    const leafSizes: Array<{ id: string; width: number; height: number }> = []
    for (const leafId of group.leafIds) {
      const entity = entityById.get(leafId)
      if (!entity) {
        continue
      }
      const size = entityNodeDimensions(entity)
      leafSizes.push({ id: leafId, width: size.width, height: size.height })
    }

    if (leafSizes.length === 0) {
      continue
    }

    const side = pickFreeSide(hub, nodesById, core.edges)
    const placed = placeGrid(hub, side, leafSizes)
    for (const node of placed) {
      nodes.push(node)
      nodesById.set(node.id, node)
      placedLeafIds.add(node.id)
    }
  }

  for (const relation of schema.relations) {
    const from = relation.from.entityId
    const to = relation.to.entityId
    const touchesLeaf = placedLeafIds.has(from) || placedLeafIds.has(to)
    if (!touchesLeaf) {
      continue
    }
    if (!nodesById.has(from) || !nodesById.has(to)) {
      continue
    }
    edges.push({
      id: relation.id,
      sourceId: from,
      targetId: to,
    })
  }

  return { nodes, edges }
}
