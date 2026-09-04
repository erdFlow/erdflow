/** Type-name → Tailwind color catalog for ERD field tokens. */

const TYPE_COLOR_RULES: Array<{ pattern: RegExp; className: string }> = [
  {
    pattern: /(date|time|timestamp|year)/,
    className: "text-cyan-600 dark:text-cyan-400",
  },
  { pattern: /(bool)/, className: "text-green-600 dark:text-green-400" },
  { pattern: /(enum|set)/, className: "text-violet-600 dark:text-violet-400" },
  {
    pattern: /(int|float|double|decimal|numeric|real|serial|number|money|bit)/,
    className: "text-amber-600 dark:text-amber-500",
  },
  {
    pattern: /(char|text|string|uuid|json|blob|binary|clob)/,
    className: "text-orange-600 dark:text-orange-400",
  },
]

export const TYPE_COLOR_FALLBACK = "text-muted-foreground"

/** Colour a type token by broad category, roughly matching common ERD tools. */
export function typeColorClass(typeName: string): string {
  const n = typeName.toLowerCase()
  for (const rule of TYPE_COLOR_RULES) {
    if (rule.pattern.test(n)) {
      return rule.className
    }
  }
  return TYPE_COLOR_FALLBACK
}
