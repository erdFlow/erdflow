import {
  Background,
  Controls,
  MiniMap,
  type NodeMouseHandler,
  type OnNodeDrag,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react"
import { useCallback, useEffect, useMemo } from "react"
import "@xyflow/react/dist/style.css"
import {
  CANVAS_MIN_HEIGHT_CLASS,
  CANVAS_MIN_ZOOM,
  FIT_VIEW_PADDING,
  FOCUS_NODE_ZOOM,
  FOCUS_VIEW_DURATION_MS,
  MINIMAP_AUTO_HIDE_NODE_COUNT,
} from "../../data/constants.js"
import {
  buildDisplayEdges,
  buildDisplayNodes,
  matchingNodeIds,
} from "../../lib/diagram-display.js"
import { getConnectedIds } from "../../lib/focus-utils.js"
import { useDiagramStore } from "../../store/diagram-store.js"
import type { DiagramFlowNode } from "../../types/flow-types.js"
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

  const query = searchQuery.trim().toLowerCase()

  const focusSets = useMemo(() => {
    if (!schema || !focusedEntityId) {
      return null
    }
    return getConnectedIds(schema, focusedEntityId)
  }, [focusedEntityId, schema])

  const displayNodes = useMemo(
    () => buildDisplayNodes(nodes, query, focusSets),
    [focusSets, nodes, query]
  )

  const displayEdges = useMemo(
    () => buildDisplayEdges(edges, nodes, query, focusSets, showRelations),
    [edges, focusSets, nodes, query, showRelations]
  )

  // Single camera: focus → related set @ ~70%; else search → matches.
  useEffect(() => {
    const { nodes: currentNodes, schema: currentSchema } =
      useDiagramStore.getState()

    let targetIds: string[] = []
    let maxZoom: number | undefined
    let duration = 200

    if (focusedEntityId && currentSchema) {
      targetIds = [...getConnectedIds(currentSchema, focusedEntityId).nodeIds]
      maxZoom = FOCUS_NODE_ZOOM
      duration = FOCUS_VIEW_DURATION_MS
    } else if (query) {
      targetIds = matchingNodeIds(currentNodes, query)
    }

    if (targetIds.length === 0) {
      return
    }

    const frame = requestAnimationFrame(() => {
      void fitView({
        nodes: targetIds.map((id) => ({ id })),
        padding: FIT_VIEW_PADDING,
        maxZoom,
        duration,
      }).then(() => {
        setZoom(getZoom())
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [fitView, focusedEntityId, getZoom, query, setZoom])

  const onNodeClick: NodeMouseHandler<DiagramFlowNode> = useCallback(
    (_event, node) => {
      setSelectedEdgeId(null)
      if (node.data.kind === "entity") {
        setFocusedEntityId(node.data.entity.id)
      }
    },
    [setFocusedEntityId, setSelectedEdgeId]
  )

  const onPaneClick = useCallback(() => {
    setSelectedEdgeId(null)
  }, [setSelectedEdgeId])

  const onNodeDragStop: OnNodeDrag<DiagramFlowNode> = useCallback(
    (_event, node) => {
      setManualPosition(node.id, node.position)
    },
    [setManualPosition]
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
      onNodesChange={onNodesChange}
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
