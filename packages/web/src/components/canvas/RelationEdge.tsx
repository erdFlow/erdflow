import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import { Badge } from "@workspace/ui/components/badge";
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

function buildPathFromPoints(
  points: Array<{ x: number; y: number }>,
): string {
  if (points.length === 0) {
    return "";
  }

  const [first, ...rest] = points;
  return `M ${first!.x},${first!.y} ${rest.map((point) => `L ${point.x},${point.y}`).join(" ")}`;
}

function RelationEdgeComponent({
  id,
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
  const [fallbackPath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const routedPath =
    edgeData?.points && edgeData.points.length > 0
      ? buildPathFromPoints(edgeData.points)
      : fallbackPath;

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
