import { ENTITY_HEADER_HEIGHT } from "@erdflow/layout"
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
  FOCUS_EDGE_OPACITY,
  FOCUS_NODE_OPACITY,
  LOD_COLLAPSE_ZOOM,
  MINIMAP_AUTO_HIDE_NODE_COUNT,
} from "../../data/constants.js"
import { getConnectedIds } from "../../lib/focus-utils.js"
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
  const { resolvedTheme } = useTheme()
  const schema = useDiagramStore((state) => state.schema)
  const nodes = useDiagramStore((state) => state.nodes)
  const edges = useDiagramStore((state) => state.edges)
  const searchQuery = useDiagramStore((state) => state.searchQuery)
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)
  const showRelations = useDiagramStore((state) => state.showRelations)
  const showMinimap = useDiagramStore((state) => state.showMinimap)
  const zoom = useDiagramStore((state) => state.zoom)
  const setFocusedEntityId = useDiagramStore(
    (state) => state.setFocusedEntityId
  )
  const setManualPosition = useDiagramStore((state) => state.setManualPosition)
  const onNodesChange = useDiagramStore((state) => state.onNodesChange)
  const setZoom = useDiagramStore((state) => state.setZoom)
  const isDark = resolvedTheme === "dark"
  const lodCollapsed = zoom < LOD_COLLAPSE_ZOOM
  const showMinimapEffective =
    showMinimap && nodes.length < MINIMAP_AUTO_HIDE_NODE_COUNT

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const focusSets = useMemo(() => {
    if (!schema || !focusedEntityId) {
      return null
    }
    return getConnectedIds(schema, focusedEntityId)
  }, [focusedEntityId, schema])

  const displayNodes = useMemo(() => {
    return nodes.map((node) => {
      let hidden = false
      let opacity = 1

      if (normalizedQuery) {
        const nodeData = node.data as DiagramNodeData
        const entityName =
          nodeData.kind === "entity"
            ? nodeData.entity.name
            : nodeData.enumDef.name
        hidden = !entityName.toLowerCase().includes(normalizedQuery)
      }

      if (focusSets && !hidden) {
        opacity = focusSets.nodeIds.has(node.id) ? 1 : FOCUS_NODE_OPACITY
      }

      const nodeData = node.data as DiagramNodeData
      const forceCollapsed = lodCollapsed
      const collapsed =
        nodeData.kind === "entity"
          ? nodeData.collapsed || forceCollapsed
          : forceCollapsed

      const nextHeight =
        nodeData.kind === "entity" && collapsed
          ? ENTITY_HEADER_HEIGHT
          : nodeData.kind === "enum" && forceCollapsed
            ? ENTITY_HEADER_HEIGHT
            : node.style?.height

      const currentOpacity = node.style?.opacity ?? 1
      const dataCollapsed =
        nodeData.kind === "entity"
          ? nodeData.collapsed
          : Boolean(nodeData.compact)
      const sameDataCollapsed = dataCollapsed === collapsed
      const sameHeight = node.style?.height === nextHeight

      if (
        node.hidden === hidden &&
        currentOpacity === opacity &&
        sameDataCollapsed &&
        sameHeight
      ) {
        return node
      }

      if (nodeData.kind === "entity") {
        return {
          ...node,
          hidden,
          data: {
            ...nodeData,
            collapsed,
          },
          style: {
            ...node.style,
            opacity,
            height: nextHeight,
          },
        }
      }

      return {
        ...node,
        hidden,
        data: {
          ...nodeData,
          compact: forceCollapsed,
        },
        style: {
          ...node.style,
          opacity,
          ...(forceCollapsed ? { height: ENTITY_HEADER_HEIGHT } : null),
        },
      }
    })
  }, [focusSets, lodCollapsed, nodes, normalizedQuery])

  const displayEdges = useMemo(() => {
    return edges.map((edge) => {
      const hidden = !showRelations
      let opacity = 1

      if (focusSets && showRelations) {
        opacity = focusSets.edgeIds.has(edge.id) ? 1 : FOCUS_EDGE_OPACITY
      }

      return {
        ...edge,
        hidden,
        data: {
          ...edge.data,
          simplified: lodCollapsed,
        },
        style: {
          ...edge.style,
          opacity,
        },
      }
    })
  }, [edges, focusSets, lodCollapsed, showRelations])

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const data = node.data as DiagramNodeData
      if (data.kind === "entity") {
        setFocusedEntityId(node.id)
      }
    },
    [setFocusedEntityId]
  )

  const onNodeDragStop: OnNodeDrag = useCallback(
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
