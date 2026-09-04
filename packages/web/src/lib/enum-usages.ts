import type { UniversalSchema } from "@erdflow/core"

export interface EnumUsage {
  table: string
  field: string
}

/** Fields whose type name matches the enum name (e.g. User.status → OrderStatus). */
export function enumUsages(
  schema: UniversalSchema,
  enumName: string
): EnumUsage[] {
  const usages: EnumUsage[] = []

  for (const entity of schema.entities) {
    for (const field of entity.fields) {
      if (field.type.name === enumName) {
        usages.push({ table: entity.name, field: field.name })
      }
    }
  }

  return usages
}

export function formatEnumUsage(usage: EnumUsage): string {
  return `${usage.table}.${usage.field}`
}
