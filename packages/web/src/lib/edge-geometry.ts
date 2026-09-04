import { entityFieldCenterY } from "./node-dimensions.js";

export interface NodeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Minimal node shape needed to compute absolute box bounds. */
export interface MeasurableNode {
  internals: { positionAbsolute: { x: number; y: number } };
  measured?: { width?: number; height?: number } | null;
  width?: number | null;
  height?: number | null;
}

/** Endpoint cardinality symbols: "1" for a single side, "n" for a many side. */
export function cardinalitySymbols(
  cardinality: string,
): { source: string; target: string } {
  const [from, to] = cardinality.split("-to-");
  return {
    source: from === "many" ? "n" : "1",
    target: to === "many" ? "n" : "1",
  };
}

export function buildPathFromPoints(
  points: Array<{ x: number; y: number }>,
): string {
  if (points.length === 0) {
    return "";
  }

  const [first, ...rest] = points;
  return `M ${first!.x},${first!.y} ${rest.map((point) => `L ${point.x},${point.y}`).join(" ")}`;
}

export function nodeBox(node: MeasurableNode | null | undefined): NodeBox | null {
  if (!node) return null;
  const position = node.internals.positionAbsolute;
  const width = node.measured?.width ?? (node.width as number | undefined) ?? 220;
  const height =
    node.measured?.height ?? (node.height as number | undefined) ?? 80;
  return { x: position.x, y: position.y, width, height };
}

/** Anchor point on the nearer vertical edge of a node, at a given field row. */
export function anchor(
  box: NodeBox,
  onRight: boolean,
  fieldIndex: number | undefined,
): { x: number; y: number } {
  const x = onRight ? box.x + box.width : box.x;
  const rawY =
    fieldIndex != null ? entityFieldCenterY(fieldIndex) : box.height / 2;
  const y = box.y + Math.min(Math.max(rawY, 8), box.height - 4);
  return { x, y };
}
