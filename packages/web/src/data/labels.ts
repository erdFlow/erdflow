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
export const SETTINGS_LABEL = "Settings"
export const THEME_LABEL = "Theme"
export const THEME_LIGHT_LABEL = "Light"
export const THEME_DARK_LABEL = "Dark"
export const THEME_SYSTEM_LABEL = "System"
