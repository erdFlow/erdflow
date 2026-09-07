/** Laravel-ish inflection helpers for model/table/FK names (no PHP runtime). */

export function snakeCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase()
}

export function pluralize(word: string): string {
  const lower = word.toLowerCase()
  if (lower.endsWith("y") && lower.length > 1 && !/[aeiou]y$/.test(lower)) {
    return `${word.slice(0, -1)}ies`
  }
  if (
    lower.endsWith("s") ||
    lower.endsWith("x") ||
    lower.endsWith("z") ||
    lower.endsWith("ch") ||
    lower.endsWith("sh")
  ) {
    return `${word}es`
  }
  return `${word}s`
}

export function singularize(word: string): string {
  const lower = word.toLowerCase()
  if (lower.endsWith("ies") && lower.length > 3) {
    return `${word.slice(0, -3)}y`
  }
  if (
    lower.endsWith("ses") ||
    lower.endsWith("xes") ||
    lower.endsWith("zes") ||
    lower.endsWith("ches") ||
    lower.endsWith("shes")
  ) {
    return word.slice(0, -2)
  }
  if (lower.endsWith("s") && !lower.endsWith("ss") && lower.length > 1) {
    return word.slice(0, -1)
  }
  return word
}

/** Model class basename → default table name (`User` → `users`). */
export function modelNameToTable(modelName: string): string {
  return pluralize(snakeCase(modelName))
}

/** Default belongsTo FK column (`User` → `user_id`). */
export function defaultForeignKey(modelName: string): string {
  return `${snakeCase(modelName)}_id`
}

/** Strip namespace / `::class` to basename (`App\\Models\\User::class` → `User`). */
export function classBasename(ref: string): string {
  const cleaned = ref
    .replace(/::class$/, "")
    .replace(/^["']|["']$/g, "")
    .trim()
  const parts = cleaned.split(/\\|\//)
  return parts[parts.length - 1] ?? cleaned
}
