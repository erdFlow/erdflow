/** Colour a type token by broad category, roughly matching common ERD tools. */
export function typeColorClass(typeName: string): string {
  const n = typeName.toLowerCase()
  if (/(date|time|timestamp|year)/.test(n)) {
    return "text-cyan-600 dark:text-cyan-400"
  }
  if (/(bool)/.test(n)) return "text-green-600 dark:text-green-400"
  if (/(enum|set)/.test(n)) return "text-violet-600 dark:text-violet-400"
  if (
    /(int|float|double|decimal|numeric|real|serial|number|money|bit)/.test(n)
  ) {
    return "text-amber-600 dark:text-amber-500"
  }
  if (/(char|text|string|uuid|json|blob|binary|clob)/.test(n)) {
    return "text-orange-600 dark:text-orange-400"
  }
  return "text-muted-foreground"
}
