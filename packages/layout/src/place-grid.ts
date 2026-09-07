import type { LayoutNode } from "./types.js"

export const GRID_GAP = 40

export interface GridItemSize {
  id: string
  width: number
  height: number
}

/**
 * Pack items into a near-square grid with top-left at (originX, originY).
 */
export function placeGridAt(
  originX: number,
  originY: number,
  items: GridItemSize[],
  kind: LayoutNode["kind"]
): LayoutNode[] {
  if (items.length === 0) {
    return []
  }

  const cols = Math.max(1, Math.ceil(Math.sqrt(items.length)))
  const rows = Math.ceil(items.length / cols)

  const colWidths: number[] = Array.from({ length: cols }, () => 0)
  const rowHeights: number[] = Array.from({ length: rows }, () => 0)

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]
    if (!item) continue
    const col = i % cols
    const row = Math.floor(i / cols)
    colWidths[col] = Math.max(colWidths[col] ?? 0, item.width)
    rowHeights[row] = Math.max(rowHeights[row] ?? 0, item.height)
  }

  const placed: LayoutNode[] = []
  let y = originY
  for (let row = 0; row < rows; row += 1) {
    let x = originX
    const rowHeight = rowHeights[row] ?? 0
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col
      const item = items[index]
      const colWidth = colWidths[col] ?? 0
      if (item) {
        placed.push({
          id: item.id,
          kind,
          x,
          y,
          width: item.width,
          height: item.height,
        })
      }
      x += colWidth + GRID_GAP
    }
    y += rowHeight + GRID_GAP
  }

  return placed
}

export function gridBounds(items: GridItemSize[]): {
  width: number
  height: number
} {
  if (items.length === 0) {
    return { width: 0, height: 0 }
  }

  const cols = Math.max(1, Math.ceil(Math.sqrt(items.length)))
  const rows = Math.ceil(items.length / cols)

  const colWidths: number[] = Array.from({ length: cols }, () => 0)
  const rowHeights: number[] = Array.from({ length: rows }, () => 0)

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]
    if (!item) continue
    const col = i % cols
    const row = Math.floor(i / cols)
    colWidths[col] = Math.max(colWidths[col] ?? 0, item.width)
    rowHeights[row] = Math.max(rowHeights[row] ?? 0, item.height)
  }

  return {
    width:
      colWidths.reduce((sum, w) => sum + w, 0) +
      GRID_GAP * Math.max(0, cols - 1),
    height:
      rowHeights.reduce((sum, h) => sum + h, 0) +
      GRID_GAP * Math.max(0, rows - 1),
  }
}
