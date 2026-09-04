import type { UniversalSchema } from "@erdflow/core";
import type { Edge, Node, NodeChange } from "@xyflow/react";

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
  onNodesChange: (changes: NodeChange[]) => void;
  setManualPosition: (nodeId: string, position: { x: number; y: number }) => void;
  setCanvasControls: (controls: CanvasControls | null) => void;
  clearFocus: () => void;
}
