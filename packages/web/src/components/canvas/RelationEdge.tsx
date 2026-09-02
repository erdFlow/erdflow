import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  Position,
  useInternalNode,
} from "@xyflow/react";
import { entityFieldCenterY } from "../../lib/node-dimensions.js";
import type { RelationEdgeData } from "../../types/flow-types.js";

/** Endpoint cardinality symbols: "1" for a single side, "n" for a many side. */
function cardinalitySymbols(cardinality: string): { source: string; target: string } {
  const [from, to] = cardinality.split("-to-");
  return {
    source: from === "many" ? "n" : "1",
    target: to === "many" ? "n" : "1",
  };
}

function buildPathFromPoints(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return "";
  }

  const [first, ...rest] = points;
  return `M ${first!.x},${first!.y} ${rest.map((point) => `L ${point.x},${point.y}`).join(" ")}`;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function nodeBox(node: ReturnType<typeof useInternalNode>): Box | null {
  if (!node) return null;
  const position = node.internals.positionAbsolute;
  const width = node.measured?.width ?? (node.width as number | undefined) ?? 220;
  const height =
    node.measured?.height ?? (node.height as number | undefined) ?? 80;
  return { x: position.x, y: position.y, width, height };
}

/** Anchor point on the nearer vertical edge of a node, at a given field row. */
function anchor(
  box: Box,
  onRight: boolean,
  fieldIndex: number | undefined,
): { x: number; y: number } {
  const x = onRight ? box.x + box.width : box.x;
  const rawY =
    fieldIndex != null ? entityFieldCenterY(fieldIndex) : box.height / 2;
  const y = box.y + Math.min(Math.max(rawY, 8), box.height - 4);
  return { x, y };
}

function EndpointBadge({
  x,
  y,
  dir,
  label,
}: {
  x: number;
  y: number;
  /** -1 = endpoint on node's left edge, +1 = right edge. Badge sits outside. */
  dir: number;
  label: string;
}) {
  return (
    <div
      className="pointer-events-none absolute flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background ring-2 ring-background"
      style={{
        transform: `translate(-50%, -50%) translate(${x + dir * 11}px, ${y}px)`,
      }}
    >
      {label}
    </div>
  );
}

function RelationEdgeComponent({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps) {
  const edgeData = data as RelationEdgeData | undefined;
  const sourceBox = nodeBox(useInternalNode(source));
  const targetBox = nodeBox(useInternalNode(target));

  let routedPath: string;
  let sEndX = sourceX;
  let sEndY = sourceY;
  let tEndX = targetX;
  let tEndY = targetY;
  let sDir = 0;
  let tDir = 0;
  let showBadges = false;

  if (sourceBox && targetBox) {
    const sourceCenterX = sourceBox.x + sourceBox.width / 2;
    const targetCenterX = targetBox.x + targetBox.width / 2;
    const sourceOnRight = targetCenterX >= sourceCenterX;

    const s = anchor(sourceBox, sourceOnRight, edgeData?.fromFieldIndex);
    const t = anchor(targetBox, !sourceOnRight, edgeData?.toFieldIndex);
    sEndX = s.x;
    sEndY = s.y;
    tEndX = t.x;
    tEndY = t.y;
    sDir = sourceOnRight ? 1 : -1;
    tDir = sourceOnRight ? -1 : 1;
    showBadges = true;

    [routedPath] = getSmoothStepPath({
      sourceX: s.x,
      sourceY: s.y,
      targetX: t.x,
      targetY: t.y,
      sourcePosition: sourceOnRight ? Position.Right : Position.Left,
      targetPosition: sourceOnRight ? Position.Left : Position.Right,
      borderRadius: 8,
    });
  } else if (edgeData?.points && edgeData.points.length > 0) {
    routedPath = buildPathFromPoints(edgeData.points);
    const first = edgeData.points[0]!;
    const last = edgeData.points[edgeData.points.length - 1]!;
    sEndX = first.x;
    sEndY = first.y;
    tEndX = last.x;
    tEndY = last.y;
  } else {
    [routedPath] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
  }

  const symbols = edgeData?.relation
    ? cardinalitySymbols(edgeData.relation.cardinality)
    : null;

  return (
    <>
      <BaseEdge id={id} path={routedPath} markerEnd={markerEnd} style={style} />
      {symbols && showBadges ? (
        <EdgeLabelRenderer>
          <EndpointBadge x={sEndX} y={sEndY} dir={sDir} label={symbols.source} />
          <EndpointBadge x={tEndX} y={tEndY} dir={tDir} label={symbols.target} />
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const RelationEdge = memo(RelationEdgeComponent);
