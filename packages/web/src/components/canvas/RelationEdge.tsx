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
import { Badge } from "@workspace/ui/components/badge";
import { entityFieldCenterY } from "../../lib/node-dimensions.js";
import type { RelationEdgeData } from "../../types/flow-types.js";

function formatCardinality(cardinality: string): string {
  switch (cardinality) {
    case "one-to-one":
      return "1:1";
    case "one-to-many":
      return "1:N";
    case "many-to-many":
      return "N:M";
    default:
      return cardinality;
  }
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
  let labelX: number;
  let labelY: number;

  if (sourceBox && targetBox) {
    const sourceCenterX = sourceBox.x + sourceBox.width / 2;
    const targetCenterX = targetBox.x + targetBox.width / 2;
    const sourceOnRight = targetCenterX >= sourceCenterX;

    const s = anchor(sourceBox, sourceOnRight, edgeData?.fromFieldIndex);
    const t = anchor(targetBox, !sourceOnRight, edgeData?.toFieldIndex);

    [routedPath, labelX, labelY] = getSmoothStepPath({
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
    [, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
  } else {
    [routedPath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
  }

  return (
    <>
      <BaseEdge id={id} path={routedPath} markerEnd={markerEnd} style={style} />
      {edgeData?.relation ? (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <Badge variant="outline">
              {formatCardinality(edgeData.relation.cardinality)}
            </Badge>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const RelationEdge = memo(RelationEdgeComponent);
