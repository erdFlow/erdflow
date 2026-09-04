/** Field-attribute pill tones and definitions for the hover tooltip. */

export const AUTO_INCREMENT_PATTERN =
  /auto_?increment|nextval|identity|autoincrement/i

export function isAutoIncrement(defaultValue: string | undefined): boolean {
  return AUTO_INCREMENT_PATTERN.test(defaultValue ?? "")
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
} as const satisfies Record<string, FieldPill>
