import {
  Background,
  Controls,
  MiniMap,
  type NodeChange,
  type NodeMouseHandler,
  type OnNodeDrag,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import "@xyflow/react/dist/style.css"
import {
  CANVAS_MIN_HEIGHT_CLASS,
  CANVAS_MIN_ZOOM,
  FIT_VIEW_PADDING,
  FOCUS_EDGE_OPACITY,
  FOCUS_NODE_OPACITY,
  FOCUS_NODE_ZOOM,
  FOCUS_VIEW_DURATION_MS,
  MINIMAP_AUTO_HIDE_NODE_COUNT,
} from "../../data/constants.js"
import { getConnectedIds } from "../../lib/focus-utils.js"
import { packFocusNeighborhood } from "../../lib/pack-focus-neighborhood.js"
import { useDiagramStore } from "../../store/diagram-store.js"
import type { DiagramNodeData } from "../../types/flow-types.js"
import { useTheme } from "../theme-provider.js"
import { edgeTypes, nodeTypes } from "./node-types.js"

function CanvasControlsRegistrar() {
  const { fitView, zoomIn, zoomOut, getZoom } = useReactFlow()
  const setCanvasControls = useDiagramStore((state) => state.setCanvasControls)
  const setZoom = useDiagramStore((state) => state.setZoom)

  useEffect(() => {
    setZoom(getZoom())
    setCanvasControls({
      fitView: () => {
        void fitView({ padding: FIT_VIEW_PADDING }).then(() => {
          setZoom(getZoom())
        })
      },
      zoomIn: () => {
        void zoomIn().then(() => {
          setZoom(getZoom())
        })
      },
      zoomOut: () => {
        void zoomOut().then(() => {
          setZoom(getZoom())
        })
      },
    })

    return () => setCanvasControls(null)
  }, [fitView, getZoom, setCanvasControls, setZoom, zoomIn, zoomOut])

  return null
}

function SchemaCanvasInner() {
  const { fitView, getZoom } = useReactFlow()
  const { resolvedTheme } = useTheme()
  const schema = useDiagramStore((state) => state.schema)
  const nodes = useDiagramStore((state) => state.nodes)
  const edges = useDiagramStore((state) => state.edges)
  const searchQuery = useDiagramStore((state) => state.searchQuery)
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)
  const showRelations = useDiagramStore((state) => state.showRelations)
  const showMinimap = useDiagramStore((state) => state.showMinimap)
  const setFocusedEntityId = useDiagramStore(
    (state) => state.setFocusedEntityId
  )
  const setSelectedEdgeId = useDiagramStore((state) => state.setSelectedEdgeId)
  const setManualPosition = useDiagramStore((state) => state.setManualPosition)
  const onNodesChange = useDiagramStore((state) => state.onNodesChange)
  const setZoom = useDiagramStore((state) => state.setZoom)
  const isDark = resolvedTheme === "dark"
  const showMinimapEffective =
    showMinimap && nodes.length < MINIMAP_AUTO_HIDE_NODE_COUNT

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const searchActive = normalizedQuery.length > 0

  const focusSets = useMemo(() => {
    if (!schema || !focusedEntityId) {
      return null
    }
    return getConnectedIds(schema, focusedEntityId)
  }, [focusedEntityId, schema])

  const matchingNodeIds = useMemo(() => {
    if (!searchActive) {
      return null
    }

    const ids = new Set<string>()
    for (const node of nodes) {
      const nodeData = node.data as DiagramNodeData
      const entityName =
        nodeData.kind === "entity"
          ? nodeData.entity.name
          : nodeData.enumDef.name
      if (entityName.toLowerCase().includes(normalizedQuery)) {
        ids.add(node.id)
      }
    }
    return ids
  }, [nodes, normalizedQuery, searchActive])

  /** Focused entity + related tables + enums used by them / matching search. */
  const neighborhoodIds = useMemo(() => {
    if (!focusSets) {
      return null
    }
    const ids = new Set(focusSets.nodeIds)
    if (!searchActive || !schema) {
      return ids
    }

    const focusedNames = new Set(
      schema.entities
        .filter((entity) => focusSets.nodeIds.has(entity.id))
        .map((entity) => entity.name)
    )

    for (const node of nodes) {
      const data = node.data as DiagramNodeData
      if (data.kind !== "enum") {
        continue
      }
      if (matchingNodeIds?.has(node.id)) {
        ids.add(node.id)
        continue
      }
      if (data.usages.some((usage) => focusedNames.has(usage.table))) {
        ids.add(node.id)
      }
    }
    return ids
  }, [focusSets, matchingNodeIds, nodes, schema, searchActive])

  const packSessionKey =
    searchActive && focusedEntityId && neighborhoodIds
      ? `${focusedEntityId}:${[...neighborhoodIds].sort().join(",")}`
      : null

  // Snapshot pack once per focus/search session so drags aren't overwritten.
  const [packOverlay, setPackOverlay] = useState<Map<
    string,
    { x: number; y: number }
  > | null>(null)

  useEffect(() => {
    if (!packSessionKey) {
      setPackOverlay(null)
      return
    }
    const separator = packSessionKey.indexOf(":")
    const focusId = packSessionKey.slice(0, separator)
    const relatedIds = new Set(
      packSessionKey
        .slice(separator + 1)
        .split(",")
        .filter(Boolean)
    )
    const currentNodes = useDiagramStore.getState().nodes
    setPackOverlay(packFocusNeighborhood(currentNodes, focusId, relatedIds))
  }, [packSessionKey])

  const displayNodes = useMemo(() => {
    return nodes.map((node) => {
      let hidden = false

      if (neighborhoodIds && searchActive) {
        // Search + focus: show focused table + related tables + enums.
        hidden = !neighborhoodIds.has(node.id)
      } else if (matchingNodeIds) {
        // Search only: name matches.
        hidden = !matchingNodeIds.has(node.id)
      }

      let opacity = 1
      if (focusSets && !searchActive && !hidden) {
        // No search + focus: full graph with dimming (image 1).
        opacity = focusSets.nodeIds.has(node.id) ? 1 : FOCUS_NODE_OPACITY
      }

      const packed = packOverlay?.get(node.id)
      const position = packed ?? node.position
      const positionChanged =
        position.x !== node.position.x || position.y !== node.position.y

      const currentOpacity = node.style?.opacity ?? 1
      if (
        node.hidden === hidden &&
        currentOpacity === opacity &&
        !positionChanged
      ) {
        return node
      }

      return {
        ...node,
        hidden,
        position,
        style: {
          ...node.style,
          opacity,
        },
      }
    })
  }, [
    focusSets,
    matchingNodeIds,
    neighborhoodIds,
    nodes,
    packOverlay,
    searchActive,
  ])

  const displayEdges = useMemo(() => {
    return edges.map((edge) => {
      let hidden = !showRelations

      if (!hidden && focusSets && searchActive && neighborhoodIds) {
        hidden = !focusSets.edgeIds.has(edge.id)
      } else if (!hidden && matchingNodeIds) {
        hidden =
          !matchingNodeIds.has(edge.source) ||
          !matchingNodeIds.has(edge.target)
      }

      let opacity = 1
      if (!hidden && focusSets && !searchActive && showRelations) {
        opacity = focusSets.edgeIds.has(edge.id) ? 1 : FOCUS_EDGE_OPACITY
      }

      return {
        ...edge,
        hidden,
        style: {
          ...edge.style,
          opacity,
        },
      }
    })
  }, [
    edges,
    focusSets,
    matchingNodeIds,
    neighborhoodIds,
    searchActive,
    showRelations,
  ])

  // Zoom canvas to filtered matches when searching without focus.
  useEffect(() => {
    if (!searchActive || focusedEntityId) {
      return
    }

    const currentNodes = useDiagramStore.getState().nodes
    const targets = currentNodes.filter((node) => {
      const nodeData = node.data as DiagramNodeData
      const name =
        nodeData.kind === "entity"
          ? nodeData.entity.name
          : nodeData.enumDef.name
      return name.toLowerCase().includes(normalizedQuery)
    })
    if (targets.length === 0) {
      return
    }

    const frame = requestAnimationFrame(() => {
      void fitView({
        nodes: targets.map((node) => ({ id: node.id })),
        padding: FIT_VIEW_PADDING,
        duration: 200,
      }).then(() => {
        setZoom(getZoom())
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [fitView, focusedEntityId, getZoom, normalizedQuery, searchActive, setZoom])

  // Frame focused table + all related nodes (~70% max zoom).
  useEffect(() => {
    if (!focusedEntityId || !neighborhoodIds) {
      return
    }

    const targetIds = [...neighborhoodIds]
    const frame = requestAnimationFrame(() => {
      void fitView({
        nodes: targetIds.map((id) => ({ id })),
        padding: FIT_VIEW_PADDING,
        maxZoom: FOCUS_NODE_ZOOM,
        duration: FOCUS_VIEW_DURATION_MS,
      }).then(() => {
        setZoom(getZoom())
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [fitView, focusedEntityId, getZoom, neighborhoodIds, setZoom])

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedEdgeId(null)
      const data = node.data as DiagramNodeData
      if (data.kind === "entity") {
        setFocusedEntityId(node.id)
      }
    },
    [setFocusedEntityId, setSelectedEdgeId]
  )

  const onPaneClick = useCallback(() => {
    setSelectedEdgeId(null)
  }, [setSelectedEdgeId])

  // During pack overlay, keep drag in the overlay so the packer doesn't snap
  // nodes back — and so we don't overwrite the global ELK layout.
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!packOverlay) {
        onNodesChange(changes)
        return
      }

      const positionChanges = changes.filter(
        (change): change is NodeChange & { type: "position" } =>
          change.type === "position"
      )
      if (positionChanges.length > 0) {
        setPackOverlay((prev) => {
          if (!prev) {
            return prev
          }
          const next = new Map(prev)
          for (const change of positionChanges) {
            if (change.position) {
              next.set(change.id, change.position)
            }
          }
          return next
        })
      }

      const rest = changes.filter((change) => change.type !== "position")
      if (rest.length > 0) {
        onNodesChange(rest)
      }
    },
    [onNodesChange, packOverlay]
  )

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      if (packOverlay) {
        setPackOverlay((prev) => {
          if (!prev) {
            return prev
          }
          const next = new Map(prev)
          next.set(node.id, { ...node.position })
          return next
        })
        return
      }
      setManualPosition(node.id, node.position)
    },
    [packOverlay, setManualPosition]
  )

  return (
    <ReactFlow
      className="size-full bg-background [&_.react-flow__edgelabel-renderer]:z-[1000]"
      colorMode={resolvedTheme}
      nodes={displayNodes}
      edges={displayEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      minZoom={CANVAS_MIN_ZOOM}
      onlyRenderVisibleElements
      panOnScroll
      zoomOnScroll
      nodesDraggable
      onNodesChange={handleNodesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onNodeDragStop={onNodeDragStop}
      onMove={(_event, viewport) => setZoom(viewport.zoom)}
      proOptions={{ hideAttribution: true }}
    >
      <CanvasControlsRegistrar />
      <Background gap={16} size={1} />
      <Controls className="!border !border-border !shadow-md" />
      {showMinimapEffective ? (
        <MiniMap
          className="!rounded-md !border !border-border !shadow-md"
          pannable
          zoomable
          nodeStrokeWidth={2}
          bgColor={isDark ? "var(--card)" : undefined}
          maskColor={
            isDark ? "rgba(0, 0, 0, 0.55)" : "rgba(240, 240, 240, 0.6)"
          }
          nodeColor={isDark ? "var(--muted-foreground)" : undefined}
        />
      ) : null}
    </ReactFlow>
  )
}

export function SchemaCanvas() {
  return (
    <div className="min-h-0 flex-1">
      <ReactFlowProvider>
        <div className={`size-full ${CANVAS_MIN_HEIGHT_CLASS}`}>
          <SchemaCanvasInner />
        </div>
      </ReactFlowProvider>
    </div>
  )
}
