import type { Node } from "@xyflow/react"
import {
  FALLBACK_NODE_HEIGHT,
  FALLBACK_NODE_WIDTH,
  FOCUS_PACK_GAP,
} from "../data/constants.js"

function nodeSize(node: Node): { width: number; height: number } {
  const width =
    typeof node.width === "number"
      ? node.width
      : typeof node.style?.width === "number"
        ? node.style.width
        : FALLBACK_NODE_WIDTH
  const height =
    typeof node.height === "number"
      ? node.height
      : typeof node.style?.height === "number"
        ? node.style.height
        : FALLBACK_NODE_HEIGHT
  return { width, height }
}

/**
 * Temporary positions for a focus neighborhood.
 * Focus stays on the left; related nodes form a multi-row grid to the right
 * with ELK-like spacing (readable edges, no single cramped line).
 * Does not mutate store / manualPositions.
 */
export function packFocusNeighborhood(
  nodes: Node[],
  focusId: string,
  relatedIds: Set<string>,
  gap: number = FOCUS_PACK_GAP
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const related = nodes.filter((node) => relatedIds.has(node.id))
  const focus = related.find((node) => node.id === focusId)
  if (!focus) {
    return positions
  }

  const hGap = gap
  const vGap = Math.round(gap * 0.75)
  const focusSize = nodeSize(focus)
  positions.set(focusId, { ...focus.position })

  const others = related
    .filter((node) => node.id !== focusId)
    .sort((a, b) => a.id.localeCompare(b.id))

  if (others.length === 0) {
    return positions
  }

  // Prefer ~2–3 columns so edges stay readable (not one long horizontal strip).
  const cols = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(others.length))))
  const sizes = others.map((node) => nodeSize(node))

  const colWidths: number[] = Array.from({ length: cols }, () => 0)
  const rowHeights: number[] = []
  for (let i = 0; i < others.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const size = sizes[i]
    if (!size) {
      continue
    }
    colWidths[col] = Math.max(colWidths[col] ?? 0, size.width)
    rowHeights[row] = Math.max(rowHeights[row] ?? 0, size.height)
  }

  const gridOriginX = focus.position.x + focusSize.width + hGap
  const gridHeight =
    rowHeights.reduce((sum, h) => sum + h, 0) +
    Math.max(0, rowHeights.length - 1) * vGap
  // Vertically center the grid against the focused table.
  const gridOriginY =
    focus.position.y + focusSize.height / 2 - gridHeight / 2

  const colXs: number[] = []
  let x = gridOriginX
  for (let c = 0; c < cols; c++) {
    colXs[c] = x
    x += (colWidths[c] ?? 0) + hGap
  }

  const rowYs: number[] = []
  let y = gridOriginY
  for (let r = 0; r < rowHeights.length; r++) {
    rowYs[r] = y
    y += (rowHeights[r] ?? 0) + vGap
  }

  for (let i = 0; i < others.length; i++) {
    const node = others[i]
    if (!node) {
      continue
    }
    const col = i % cols
    const row = Math.floor(i / cols)
    positions.set(node.id, {
      x: colXs[col] ?? gridOriginX,
      y: rowYs[row] ?? gridOriginY,
    })
  }

  return positions
}
