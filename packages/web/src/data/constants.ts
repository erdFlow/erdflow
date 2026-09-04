/** App-wide scalars, paths, and string enums (drawdb-style constants). */

export const BRAND_NAME = "erdflow"

export const SCHEMA_API_PATH = "/api/schema"
export const SCHEMA_WS_PATH = "/ws"
export const SCHEMA_RECONNECT_MS = 1000
export const UNKNOWN_SCHEMA_ERROR = "Unknown schema error"

export const FIT_VIEW_PADDING = 0.2
export const CANVAS_MIN_ZOOM = 0.2
export const FOCUS_NODE_OPACITY = 0.25
export const FOCUS_EDGE_OPACITY = 0.2
export const CANVAS_MIN_HEIGHT_CLASS = "min-h-[480px]"

export const FALLBACK_NODE_WIDTH = 220
export const FALLBACK_NODE_HEIGHT = 80
export const ANCHOR_Y_MIN = 8
export const ANCHOR_Y_MAX_INSET = 4

export const FIELD_TOOLBAR_OFFSET = 8
export const FIELD_TOOLTIP_WIDTH_CLASS = "w-52"
export const FIELD_TYPE_COLUMN_WIDTH_CLASS = "w-[76px]"

export const EDGE_BADGE_OFFSET = 11
export const EDGE_SMOOTH_STEP_RADIUS = 8
export const EDGE_HIT_STROKE_WIDTH = 24
export const EDGE_HOVER_STROKE = "#3b82f6"
export const EDGE_HOVER_STROKE_WIDTH = 2.5
export const EDGE_HOVER_DASHARRAY = "6 5"
export const EDGE_HOVER_ANIMATION = "dashdraw 0.5s linear infinite"

export const NodeKind = {
  TABLE: "table",
  ENUM: "enum",
} as const

export const EdgeKind = {
  RELATION: "relation",
} as const

/** Canvas zoom shortcuts (Mod = ⌘ on macOS, Ctrl on Windows/Linux). */
export const HOTKEY_ZOOM_IN = "Mod+="
export const HOTKEY_ZOOM_OUT = "Mod+-"
export const HOTKEY_FIT_VIEW = "Mod+0"
export const HOTKEY_CLEAR_FOCUS = "Escape"

export const SQL_VIEW_WIDTH_DEFAULT = 384
export const SQL_VIEW_WIDTH_MIN = 280
export const SQL_VIEW_WIDTH_MAX = 720

export type NodeKindValue = (typeof NodeKind)[keyof typeof NodeKind]
export type EdgeKindValue = (typeof EdgeKind)[keyof typeof EdgeKind]
