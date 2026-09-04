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
  FIT_VIEW_PADDING,
  FOCUS_EDGE_OPACITY,
  FOCUS_NODE_OPACITY,
} from "../../data/constants.js"
import { getConnectedIds } from "../../lib/focus-utils.js"
import { useDiagramStore } from "../../store/diagram-store.js"
import type { DiagramNodeData } from "../../types/flow-types.js"
import { edgeTypes, nodeTypes } from "./node-types.js"

function CanvasControlsRegistrar() {
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  const setCanvasControls = useDiagramStore((state) => state.setCanvasControls)

  useEffect(() => {
    setCanvasControls({
      fitView: () => fitView({ padding: FIT_VIEW_PADDING }),
      zoomIn: () => zoomIn(),
      zoomOut: () => zoomOut(),
    })

    return () => setCanvasControls(null)
  }, [fitView, setCanvasControls, zoomIn, zoomOut])

  return null
}

function SchemaCanvasInner() {
  const schema = useDiagramStore((state) => state.schema)
  const nodes = useDiagramStore((state) => state.nodes)
  const edges = useDiagramStore((state) => state.edges)
  const searchQuery = useDiagramStore((state) => state.searchQuery)
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)
  const showRelations = useDiagramStore((state) => state.showRelations)
  const setFocusedEntityId = useDiagramStore(
    (state) => state.setFocusedEntityId
  )
  const setManualPosition = useDiagramStore((state) => state.setManualPosition)
  const onNodesChange = useDiagramStore((state) => state.onNodesChange)

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

      const currentOpacity = node.style?.opacity ?? 1
      if (node.hidden === hidden && currentOpacity === opacity) {
        return node
      }

      return {
        ...node,
        hidden,
        style: {
          ...node.style,
          opacity,
        },
      }
    })
  }, [focusSets, nodes, normalizedQuery])

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
        style: {
          ...edge.style,
          opacity,
        },
      }
    })
  }, [edges, focusSets, showRelations])

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
      className="size-full bg-background"
      nodes={displayNodes}
      edges={displayEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      panOnScroll
      zoomOnScroll
      nodesDraggable
      onNodesChange={onNodesChange}
      onNodeClick={onNodeClick}
      onNodeDragStop={onNodeDragStop}
      proOptions={{ hideAttribution: true }}
    >
      <CanvasControlsRegistrar />
      <Background />
      <Controls />
      <MiniMap />
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
