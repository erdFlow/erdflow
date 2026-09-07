import type { EntityId, UniversalSchema } from "@erdflow/core"
import type { LayoutPoint } from "@erdflow/layout"
import type { NodeChange } from "@xyflow/react"
import type { DiagramFlowNode, RelationFlowEdge } from "./flow-types.js"

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

export interface CanvasControls {
  fitView: () => void
  zoomIn: () => void
  zoomOut: () => void
}

export interface DiagramState {
  schema: UniversalSchema | null
  nodes: DiagramFlowNode[]
  edges: RelationFlowEdge[]
  error: string | null
  connectionStatus: ConnectionStatus
  searchQuery: string
  focusedEntityId: EntityId | null
  /** Pinned relationship edge highlight (same visuals as hover). */
  selectedEdgeId: string | null
  showRelations: boolean
  showMinimap: boolean
  showSqlView: boolean
  showRelationshipTable: boolean
  sqlViewWidth: number
  /** Selected schema version for future multi-version filtering. */
  selectedSchemaVersion: string | null
  zoom: number
  collapsedTables: Partial<Record<EntityId, boolean>>
  manualPositions: Record<string, LayoutPoint>
  canvasControls: CanvasControls | null
  applySchema: (schema: UniversalSchema) => Promise<void>
  setError: (message: string | null) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setSearchQuery: (query: string) => void
  setFocusedEntityId: (entityId: EntityId | null) => void
  setSelectedEdgeId: (edgeId: string | null) => void
  setShowRelations: (show: boolean) => void
  setShowMinimap: (show: boolean) => void
  setShowSqlView: (show: boolean) => void
  setShowRelationshipTable: (show: boolean) => void
  setSqlViewWidth: (width: number) => void
  setSelectedSchemaVersion: (version: string | null) => void
  setZoom: (zoom: number) => void
  toggleTableCollapsed: (entityId: EntityId) => void
  onNodesChange: (changes: NodeChange<DiagramFlowNode>[]) => void
  setManualPosition: (nodeId: string, position: LayoutPoint) => void
  setCanvasControls: (controls: CanvasControls | null) => void
  clearFocus: () => void
}
