import type { UniversalSchema } from "@erdflow/core"
import { entityNodeDimensions, enumNodeDimensions } from "./node-dimensions.js"
import { GRID_GAP, type GridItemSize, placeGridAt } from "./place-grid.js"
import type { LayoutNode, LayoutResult } from "./types.js"

function nodesBBox(nodes: LayoutNode[]): {
  left: number
  top: number
  bottom: number
} {
  if (nodes.length === 0) {
    return { left: 0, top: 0, bottom: 0 }
  }

  let left = Number.POSITIVE_INFINITY
  let top = Number.POSITIVE_INFINITY
  let bottom = Number.NEGATIVE_INFINITY
  for (const node of nodes) {
    left = Math.min(left, node.x)
    top = Math.min(top, node.y)
    bottom = Math.max(bottom, node.y + node.height)
  }
  return { left, top, bottom }
}

/**
 * Place isolated tables and enums in two stacked bands below the core bbox.
 * Tables never interleave with enums.
 */
export function placeOrphans(
  laidOut: LayoutResult,
  schema: UniversalSchema,
  isolatedEntityIds: string[],
  enumIds: string[]
): LayoutResult {
  if (isolatedEntityIds.length === 0 && enumIds.length === 0) {
    return laidOut
  }

  const entityById = new Map(
    schema.entities.map((entity) => [entity.id as string, entity])
  )
  const enumById = new Map(
    schema.enums.map((enumDef) => [enumDef.id as string, enumDef])
  )

  const tableSizes: GridItemSize[] = []
  for (const id of isolatedEntityIds) {
    const entity = entityById.get(id)
    if (!entity) continue
    const size = entityNodeDimensions(entity)
    tableSizes.push({ id, width: size.width, height: size.height })
  }

  const enumSizes: GridItemSize[] = []
  for (const id of enumIds) {
    const enumDef = enumById.get(id)
    if (!enumDef) continue
    const size = enumNodeDimensions(enumDef)
    enumSizes.push({ id, width: size.width, height: size.height })
  }

  const bbox = nodesBBox(laidOut.nodes)
  const hasCore = laidOut.nodes.length > 0
  let nextY = hasCore ? bbox.bottom + GRID_GAP : 0
  const originX = hasCore ? bbox.left : 0

  const nodes = [...laidOut.nodes]

  if (tableSizes.length > 0) {
    const placed = placeGridAt(originX, nextY, tableSizes, "entity")
    nodes.push(...placed)
    let bandBottom = nextY
    for (const node of placed) {
      bandBottom = Math.max(bandBottom, node.y + node.height)
    }
    nextY = bandBottom + GRID_GAP
  }

  if (enumSizes.length > 0) {
    const placed = placeGridAt(originX, nextY, enumSizes, "enum")
    nodes.push(...placed)
  }

  return { nodes, edges: laidOut.edges }
}
