import type { ConnectionStatus } from "../types/diagram-store.js"

/** UI copy catalogs (status, sidebar, field details). */

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  connecting: "Connecting",
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Error",
}

export const UNKNOWN_SOURCE_LABEL = "Unknown source"

export const SEARCH_PLACEHOLDER = "Search tables and enums"
export const SEARCH_ARIA_LABEL = "Search tables and enums"

export const SIDEBAR_SECTION = {
  TABLES: "Tables",
  ENUMS: "Enums",
} as const

export const EMPTY_NO_SCHEMA = {
  title: "No schema loaded",
  description: "Waiting for schema from the CLI server.",
} as const

export const EMPTY_NO_MATCHES = {
  title: "No matches",
  description: "Try a different search term.",
} as const

export const FIELD_DETAIL_NOT_SET = "Not set"
export const FIELD_DETAIL_REFERENCES = "References"
export const FIELD_DETAIL_DEFAULT = "Default"
export const FIELD_DETAIL_COMMENT = "Comment"
export const FIELD_DETAIL_EMPTY_REF = "—"
