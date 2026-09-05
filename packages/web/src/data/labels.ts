import type { ConnectionStatus } from "../types/diagram-store.js"

/** UI copy catalogs (status, sidebar, field details). */

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  connecting: "Connecting",
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Error",
}

export const UNKNOWN_SOURCE_LABEL = "Unknown source"
export const SCHEMA_SOURCE_ARIA_LABEL = "Schema source"
export const SCHEMA_VERSION_ARIA_LABEL = "Schema version"

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

export const ENUM_USAGE_ARIA_LABEL = "Where this enum is used"
export const ENUM_UNUSED_LABEL = "This enum is not used by any table"

export function enumUsedByLabel(refs: string[]): string {
  if (refs.length === 0) {
    return ENUM_UNUSED_LABEL
  }

  if (refs.length === 1) {
    return `This enum is used by ${refs[0]}`
  }

  const last = refs.at(-1)
  const head = refs.slice(0, -1).join(", ")
  return `This enum is used by ${head}, and ${last}`
}

export const SHOW_RELATIONSHIPS_LABEL = "Show relationships"
export const SHOW_MINIMAP_LABEL = "Show minimap"
export const SHOW_SQL_VIEW_LABEL = "SQL View"
export const SHOW_RELATIONSHIP_TABLE_LABEL = "Relationship Table"
export const RELATIONSHIP_TABLE_TITLE = "Relationships"
export const RELATIONSHIP_TABLE_EMPTY_TITLE = "No relationships"
export const RELATIONSHIP_TABLE_EMPTY_DESCRIPTION =
  "This table has no relations to other tables."
export const RELATIONSHIP_TABLE_CLOSE_LABEL = "Close Relationship Table"
export const SQL_VIEW_EMPTY_LABEL = "Select a table to view SQL"
export const SQL_VIEW_EMPTY_DESCRIPTION =
  "Click a table on the canvas or in the sidebar."
export const SQL_VIEW_COPY_LABEL = "Copy SQL"
export const SQL_VIEW_COPIED_LABEL = "Copied"
export const SQL_VIEW_CLOSE_LABEL = "Close SQL View"
export const SETTINGS_LABEL = "Settings"
export const THEME_LABEL = "Theme"
export const THEME_LIGHT_LABEL = "Light"
export const THEME_DARK_LABEL = "Dark"
export const THEME_SYSTEM_LABEL = "System"

export const EXPORT_ARIA_LABEL = "Export"
export const EXPORT_EXPORTING_ARIA_LABEL = "Exporting diagram"
export const EXPORT_PNG_LABEL = "PNG"
export const EXPORT_SVG_LABEL = "SVG"

export const ERROR_BOUNDARY_TITLE = "Something went wrong"
export const ERROR_BOUNDARY_DESCRIPTION =
  "The visualizer hit an unexpected error. Try again, or reload the page."
export const ERROR_BOUNDARY_RETRY_LABEL = "Try again"
export const ERROR_BOUNDARY_RELOAD_LABEL = "Reload page"
