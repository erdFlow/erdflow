import { ENTITY_HEADER_HEIGHT } from "@erdflow/layout"
import { applyNodeChanges } from "@xyflow/react"
import { create } from "zustand"
import {
  NodeKind,
  SQL_VIEW_WIDTH_DEFAULT,
  SQL_VIEW_WIDTH_MAX,
  SQL_VIEW_WIDTH_MIN,
} from "../data/constants.js"
import { mergeSchemaUpdate } from "../lib/merge-schema.js"
import type { DiagramState } from "../types/diagram-store.js"
import type { DiagramFlowNode, TableFlowNode } from "../types/flow-types.js"

function clampSqlViewWidth(width: number): number {
  return Math.min(SQL_VIEW_WIDTH_MAX, Math.max(SQL_VIEW_WIDTH_MIN, width))
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  schema: null,
  nodes: [],
  edges: [],
  error: null,
  connectionStatus: "connecting",
  searchQuery: "",
  focusedEntityId: null,
  selectedEdgeId: null,
  showRelations: true,
  showMinimap: false,
  showSqlView: false,
  showRelationshipTable: true,
  sqlViewWidth: SQL_VIEW_WIDTH_DEFAULT,
  selectedSchemaVersion: null,
  zoom: 1,
  collapsedTables: {},
  manualPositions: {},
  canvasControls: null,

  applySchema: async (schema) => {
    const state = get()
    const merged = await mergeSchemaUpdate(schema, {
      previousSchema: state.schema,
      previousNodes: state.nodes,
      previousEdges: state.edges,
      manualPositions: state.manualPositions,
      collapsedTables: state.collapsedTables,
    })

    set({
      schema,
      nodes: merged.nodes,
      edges: merged.edges,
      error: null,
      selectedEdgeId: null,
      selectedSchemaVersion:
        schema.meta?.version ??
        schema.meta?.versions?.[0] ??
        state.selectedSchemaVersion,
    })
  },

  setError: (message) => set({ error: message }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFocusedEntityId: (focusedEntityId) => set({ focusedEntityId }),
  setSelectedEdgeId: (selectedEdgeId) => set({ selectedEdgeId }),
  setShowRelations: (showRelations) => set({ showRelations }),
  setShowMinimap: (showMinimap) => set({ showMinimap }),
  setShowSqlView: (showSqlView) => set({ showSqlView }),
  setShowRelationshipTable: (showRelationshipTable) =>
    set({ showRelationshipTable }),
  setSqlViewWidth: (width) => set({ sqlViewWidth: clampSqlViewWidth(width) }),
  setSelectedSchemaVersion: (selectedSchemaVersion) =>
    set({ selectedSchemaVersion }),
  setZoom: (zoom) => set({ zoom }),
  toggleTableCollapsed: (entityId) =>
    set((state) => {
      const collapsed = !(state.collapsedTables[entityId] ?? false)
      const collapsedTables: DiagramState["collapsedTables"] = {
        ...state.collapsedTables,
        [entityId]: collapsed,
      }

      const nodes: DiagramFlowNode[] = state.nodes.map((node) => {
        if (node.id !== entityId || node.data.kind !== "entity") {
          return node
        }

        const next: TableFlowNode = {
          ...node,
          type: NodeKind.TABLE,
          data: {
            ...node.data,
            collapsed,
          },
          style: {
            ...node.style,
            height: collapsed ? ENTITY_HEADER_HEIGHT : node.style?.height,
          },
        }
        return next
      })

      return { collapsedTables, nodes }
    }),
  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as DiagramState["nodes"],
    })),
  setManualPosition: (nodeId, position) =>
    set((state) => ({
      manualPositions: {
        ...state.manualPositions,
        [nodeId]: position,
      },
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, position } : node
      ),
    })),
  setCanvasControls: (canvasControls) => set({ canvasControls }),
  clearFocus: () => set({ focusedEntityId: null, selectedEdgeId: null }),
}))
