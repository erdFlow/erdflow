import type { UniversalSchema } from "@erdflow/core"
import type { SatelliteGroup } from "./extract-leaves.js"
import { entityNodeDimensions } from "./node-dimensions.js"
import {
  GRID_GAP,
  type GridItemSize,
  gridBounds,
  placeGridAt,
} from "./place-grid.js"
import type { LayoutEdge, LayoutNode, LayoutResult } from "./types.js"

type Side = "left" | "right" | "top" | "bottom"

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

function placeGridBesideHub(
  hub: LayoutNode,
  side: Side,
  leafSizes: GridItemSize[]
): LayoutNode[] {
  const { width: gridWidth, height: gridHeight } = gridBounds(leafSizes)

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

  return placeGridAt(originX, originY, leafSizes, "entity")
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
    const placed = placeGridBesideHub(hub, side, leafSizes)
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
