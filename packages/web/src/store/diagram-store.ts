import type { UniversalSchema } from "@erdflow/core";
import type { Edge, Node } from "@xyflow/react";
import { create } from "zustand";
import { mergeSchemaUpdate } from "../lib/merge-schema.js";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface CanvasControls {
  fitView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export interface DiagramState {
  schema: UniversalSchema | null;
  nodes: Node[];
  edges: Edge[];
  error: string | null;
  connectionStatus: ConnectionStatus;
  searchQuery: string;
  focusedEntityId: string | null;
  showRelations: boolean;
  collapsedTables: Record<string, boolean>;
  manualPositions: Record<string, { x: number; y: number }>;
  canvasControls: CanvasControls | null;
  applySchema: (schema: UniversalSchema) => Promise<void>;
  setError: (message: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setSearchQuery: (query: string) => void;
  setFocusedEntityId: (entityId: string | null) => void;
  setShowRelations: (show: boolean) => void;
  toggleTableCollapsed: (entityId: string) => void;
  setManualPosition: (nodeId: string, position: { x: number; y: number }) => void;
  setCanvasControls: (controls: CanvasControls | null) => void;
  clearFocus: () => void;
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
  collapsedTables: {},
  manualPositions: {},
  canvasControls: null,

  applySchema: async (schema) => {
    const state = get();
    const merged = await mergeSchemaUpdate(schema, {
      previousSchema: state.schema,
      previousNodes: state.nodes,
      previousEdges: state.edges,
      manualPositions: state.manualPositions,
      collapsedTables: state.collapsedTables,
    });

    set({
      schema,
      nodes: merged.nodes,
      edges: merged.edges,
      error: null,
    });
  },

  setError: (message) => set({ error: message }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFocusedEntityId: (focusedEntityId) => set({ focusedEntityId }),
  setShowRelations: (showRelations) => set({ showRelations }),
  toggleTableCollapsed: (entityId) =>
    set((state) => {
      const collapsed = !(state.collapsedTables[entityId] ?? false);
      const collapsedTables = {
        ...state.collapsedTables,
        [entityId]: collapsed,
      };

      const nodes = state.nodes.map((node) => {
        if (node.id !== entityId || node.data.kind !== "entity") {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            collapsed,
          },
          style: {
            ...node.style,
            height: collapsed ? 48 : node.style?.height,
          },
        };
      });

      return { collapsedTables, nodes };
    }),
  setManualPosition: (nodeId, position) =>
    set((state) => ({
      manualPositions: {
        ...state.manualPositions,
        [nodeId]: position,
      },
    })),
  setCanvasControls: (canvasControls) => set({ canvasControls }),
  clearFocus: () => set({ focusedEntityId: null }),
}));
