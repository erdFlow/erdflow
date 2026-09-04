import { ENTITY_HEADER_HEIGHT } from "@erdflow/layout"
import { applyNodeChanges } from "@xyflow/react"
import { create } from "zustand"
import {
  SQL_VIEW_WIDTH_DEFAULT,
  SQL_VIEW_WIDTH_MAX,
  SQL_VIEW_WIDTH_MIN,
} from "../data/constants.js"
import { mergeSchemaUpdate } from "../lib/merge-schema.js"
import type { DiagramState } from "../types/diagram-store.js"

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
  showRelations: true,
  showMinimap: false,
  showSqlView: false,
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
  setShowRelations: (showRelations) => set({ showRelations }),
  setShowMinimap: (showMinimap) => set({ showMinimap }),
  setShowSqlView: (showSqlView) => set({ showSqlView }),
  setSqlViewWidth: (width) => set({ sqlViewWidth: clampSqlViewWidth(width) }),
  setSelectedSchemaVersion: (selectedSchemaVersion) =>
    set({ selectedSchemaVersion }),
  setZoom: (zoom) => set({ zoom }),
  toggleTableCollapsed: (entityId) =>
    set((state) => {
      const collapsed = !(state.collapsedTables[entityId] ?? false)
      const collapsedTables = {
        ...state.collapsedTables,
        [entityId]: collapsed,
      }

      const nodes = state.nodes.map((node) => {
        if (node.id !== entityId || node.data.kind !== "entity") {
          return node
        }

        return {
          ...node,
          data: {
            ...node.data,
            collapsed,
          },
          style: {
            ...node.style,
            height: collapsed ? ENTITY_HEADER_HEIGHT : node.style?.height,
          },
        }
      })

      return { collapsedTables, nodes }
    }),
  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) })),
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
  clearFocus: () => set({ focusedEntityId: null }),
}))
