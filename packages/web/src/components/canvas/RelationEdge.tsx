import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  Position,
  useInternalNode,
} from "@xyflow/react"
import { memo, useState } from "react"
import {
  EDGE_BADGE_OFFSET,
  EDGE_HIT_STROKE_WIDTH,
  EDGE_HOVER_ANIMATION,
  EDGE_HOVER_DASHARRAY,
  EDGE_HOVER_STROKE,
  EDGE_HOVER_STROKE_WIDTH,
  EDGE_SMOOTH_STEP_RADIUS,
} from "../../data/constants.js"
import {
  anchor,
  buildPathFromPoints,
  cardinalitySymbols,
  nodeBox,
} from "../../lib/edge-geometry.js"
import { useDiagramStore } from "../../store/diagram-store.js"
import type { RelationFlowEdge } from "../../types/flow-types.js"

function EndpointBadge({
  x,
  y,
  dir,
  label,
  opacity = 1,
}: {
  x: number
  y: number
  /** -1 = endpoint on node's left edge, +1 = right edge. Badge sits outside. */
  dir: number
  label: string
  opacity?: number
}) {
  return (
    <div
      className="pointer-events-none absolute flex size-4 items-center justify-center rounded-full bg-foreground font-semibold text-[9px] text-background ring-2 ring-background"
      style={{
        opacity,
        transform: `translate(-50%, -50%) translate(${x + dir * EDGE_BADGE_OFFSET}px, ${y}px)`,
      }}
    >
      {label}
    </div>
  )
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
}: EdgeProps<RelationFlowEdge>) {
  const edgeData = data
  const sourceBox = nodeBox(useInternalNode(source))
  const targetBox = nodeBox(useInternalNode(target))
  const [hovered, setHovered] = useState(false)
  const isSelected = useDiagramStore((state) => state.selectedEdgeId === id)
  const setSelectedEdgeId = useDiagramStore((state) => state.setSelectedEdgeId)
  const isActive = hovered || isSelected

  let routedPath: string
  let labelX = (sourceX + targetX) / 2
  let labelY = (sourceY + targetY) / 2
  let sEndX = sourceX
  let sEndY = sourceY
  let tEndX = targetX
  let tEndY = targetY
  let sDir = 0
  let tDir = 0
  let showBadges = false

  if (sourceBox && targetBox) {
    const sourceCenterX = sourceBox.x + sourceBox.width / 2
    const targetCenterX = targetBox.x + targetBox.width / 2
    const sourceOnRight = targetCenterX >= sourceCenterX

    const s = anchor(sourceBox, sourceOnRight, edgeData?.fromFieldIndex)
    const t = anchor(targetBox, !sourceOnRight, edgeData?.toFieldIndex)
    sEndX = s.x
    sEndY = s.y
    tEndX = t.x
    tEndY = t.y
    sDir = sourceOnRight ? 1 : -1
    tDir = sourceOnRight ? -1 : 1
    showBadges = true

    ;[routedPath, labelX, labelY] = getSmoothStepPath({
      sourceX: s.x,
      sourceY: s.y,
      targetX: t.x,
      targetY: t.y,
      sourcePosition: sourceOnRight ? Position.Right : Position.Left,
      targetPosition: sourceOnRight ? Position.Left : Position.Right,
      borderRadius: EDGE_SMOOTH_STEP_RADIUS,
    })
  } else if (edgeData?.points && edgeData.points.length > 0) {
    const points = edgeData.points
    routedPath = buildPathFromPoints(points)
    const first = points[0]
    const last = points[points.length - 1]
    const mid = points[Math.floor(points.length / 2)]
    if (first && last && mid) {
      sEndX = first.x
      sEndY = first.y
      tEndX = last.x
      tEndY = last.y
      labelX = mid.x
      labelY = mid.y
    }
  } else {
    ;[routedPath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    })
  }

  const symbols = edgeData?.relation
    ? cardinalitySymbols(edgeData.relation.cardinality)
    : null
  const relationLabel = edgeData?.label ?? edgeData?.relation?.name ?? null
  const opacity = typeof style?.opacity === "number" ? style.opacity : 1
  const isDimmed = opacity < 1

  const activeStyle =
    isActive && !isDimmed
      ? {
          stroke: EDGE_HOVER_STROKE,
          strokeWidth: EDGE_HOVER_STROKE_WIDTH,
          strokeDasharray: EDGE_HOVER_DASHARRAY,
          animation: EDGE_HOVER_ANIMATION,
        }
      : null

  const dimmedStyle = isDimmed
    ? {
        opacity,
        stroke: "var(--muted-foreground)",
      }
    : { opacity }

  return (
    <>
      <BaseEdge
        id={id}
        path={routedPath}
        markerEnd={isDimmed ? undefined : markerEnd}
        interactionWidth={0}
        style={{
          ...style,
          ...dimmedStyle,
          ...activeStyle,
          pointerEvents: "none",
        }}
      />
      <path
        d={routedPath}
        fill="none"
        stroke="transparent"
        strokeWidth={EDGE_HIT_STROKE_WIDTH}
        strokeLinecap="round"
        style={{
          pointerEvents: isDimmed ? "none" : "stroke",
          cursor: "pointer",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(event) => {
          event.stopPropagation()
          setSelectedEdgeId(id)
        }}
      />
      {symbols && showBadges ? (
        <EdgeLabelRenderer>
          <EndpointBadge
            x={sEndX}
            y={sEndY}
            dir={sDir}
            label={symbols.source}
            opacity={opacity}
          />
          <EndpointBadge
            x={tEndX}
            y={tEndY}
            dir={tDir}
            label={symbols.target}
            opacity={opacity}
          />
          {isActive && relationLabel && !isDimmed ? (
            <div
              className="pointer-events-none absolute z-[10000] whitespace-nowrap rounded-md border border-blue-500/40 bg-background px-2.5 py-1 font-medium text-[11px] text-blue-600 shadow-md dark:text-blue-400"
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              }}
            >
              {relationLabel}
            </div>
          ) : null}
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

export const RelationEdge = memo(RelationEdgeComponent)
