import type { Field, IdStrategy } from "@erdflow/core"

/** Field-attribute pill tones and definitions for the hover tooltip. */

export const AUTO_INCREMENT_PATTERN =
  /auto_?increment|nextval|identity|autoincrement/i

export function isAutoIncrement(defaultValue: string | undefined): boolean {
  return AUTO_INCREMENT_PATTERN.test(defaultValue ?? "")
}

/**
 * Prefer structured `field.idStrategy`; fall back to parsing Prisma default JSON.
 */
export function resolveIdStrategy(field: Field): IdStrategy | undefined {
  if (field.idStrategy && field.idStrategy !== "none") {
    return field.idStrategy
  }

  if (field.type.native === "ObjectId") {
    return "objectId"
  }

  const raw = field.default
  if (!raw) {
    return undefined
  }

  if (isAutoIncrement(raw)) {
    return "autoincrement"
  }

  try {
    const parsed = JSON.parse(raw) as { name?: string }
    if (parsed?.name) {
      switch (parsed.name.toLowerCase()) {
        case "autoincrement":
          return "autoincrement"
        case "uuid":
          return "uuid"
        case "cuid":
          return "cuid"
        case "nanoid":
          return "nanoid"
        case "auto":
          return "auto"
        default:
          break
      }
    }
  } catch {
    // plain string default
  }

  const lowered = raw.toLowerCase()
  if (lowered.includes("uuid")) return "uuid"
  if (lowered.includes("cuid")) return "cuid"
  if (lowered.includes("nanoid")) return "nanoid"
  if (lowered === "auto" || lowered.includes('"name":"auto"')) return "auto"

  return undefined
}

export const pillClass = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
} as const

export type PillTone = keyof typeof pillClass

export interface FieldPill {
  label: string
  tone: PillTone
}

export const FIELD_PILL = {
  PRIMARY_KEY: { label: "Primary key", tone: "blue" },
  FOREIGN_KEY: { label: "Foreign key", tone: "blue" },
  UNIQUE: { label: "Unique", tone: "amber" },
  NOT_NULL: { label: "Not null", tone: "violet" },
  AUTOINCREMENT: { label: "Autoincrement", tone: "green" },
  UUID: { label: "UUID", tone: "green" },
  CUID: { label: "CUID", tone: "green" },
  NANOID: { label: "Nanoid", tone: "green" },
  OBJECT_ID: { label: "ObjectId", tone: "green" },
  AUTO: { label: "Auto", tone: "green" },
} as const satisfies Record<string, FieldPill>

export function idStrategyPill(
  strategy: IdStrategy | undefined
): FieldPill | undefined {
  switch (strategy) {
    case "autoincrement":
      return FIELD_PILL.AUTOINCREMENT
    case "uuid":
      return FIELD_PILL.UUID
    case "cuid":
      return FIELD_PILL.CUID
    case "nanoid":
      return FIELD_PILL.NANOID
    case "objectId":
      return FIELD_PILL.OBJECT_ID
    case "auto":
      return FIELD_PILL.AUTO
    default:
      return undefined
  }
}
