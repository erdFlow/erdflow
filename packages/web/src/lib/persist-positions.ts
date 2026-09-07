import type { LayoutPoint } from "@erdflow/layout"
import {
  MANUAL_POSITIONS_STORAGE_KEY_PREFIX,
  MANUAL_POSITIONS_TTL_MS,
} from "../data/constants.js"

interface StoredPositions {
  v: 1
  expiresAt: number
  positions: Record<string, LayoutPoint>
}

function storageKey(schemaKey: string): string {
  return `${MANUAL_POSITIONS_STORAGE_KEY_PREFIX}:${schemaKey}`
}

/** Stable key for a schema so different projects don't share positions. */
export function positionsSchemaKey(input: {
  source?: string
  adapter?: string
  entityIds: string[]
}): string {
  if (input.source) {
    return input.source
  }
  const ids = [...input.entityIds].sort().join(",")
  return `${input.adapter ?? "schema"}:${ids}`
}

function readRaw(key: string): StoredPositions | null {
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as StoredPositions
    if (parsed?.v !== 1 || typeof parsed.expiresAt !== "number") {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function loadManualPositions(
  schemaKey: string
): Record<string, LayoutPoint> {
  if (typeof localStorage === "undefined") {
    return {}
  }

  const stored = readRaw(schemaKey)
  if (!stored) {
    return {}
  }

  if (Date.now() > stored.expiresAt) {
    try {
      localStorage.removeItem(storageKey(schemaKey))
    } catch {
      // ignore quota / private mode
    }
    return {}
  }

  return stored.positions ?? {}
}

export function saveManualPositions(
  schemaKey: string,
  positions: Record<string, LayoutPoint>
): void {
  if (typeof localStorage === "undefined") {
    return
  }

  const entry: StoredPositions = {
    v: 1,
    expiresAt: Date.now() + MANUAL_POSITIONS_TTL_MS,
    positions,
  }

  try {
    if (Object.keys(positions).length === 0) {
      localStorage.removeItem(storageKey(schemaKey))
      return
    }
    localStorage.setItem(storageKey(schemaKey), JSON.stringify(entry))
  } catch {
    // ignore quota / private mode
  }
}

/** Drop stored positions for a schema (Clear cache). */
export function clearManualPositions(schemaKey: string): void {
  saveManualPositions(schemaKey, {})
}
