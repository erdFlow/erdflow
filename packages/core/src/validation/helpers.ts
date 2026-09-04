import type {
  Entity,
  EntityId,
  FieldId,
  UniversalSchema,
} from "../schema/types.js"
import type { ValidationIssue } from "./types.js"

export function issue(
  code: string,
  message: string,
  severity: ValidationIssue["severity"],
  path?: string
): ValidationIssue {
  return { code, message, severity, path }
}

export function entityFieldMap(entity: Entity): Map<FieldId, string> {
  return new Map(entity.fields.map((field) => [field.id, field.name]))
}

export function indexSignature(
  entityId: EntityId,
  fieldIds: FieldId[]
): string {
  return `${entityId}:${fieldIds.join(",")}`
}

export interface DuplicateId {
  id: string
  locations: string[]
}

export function findDuplicateIds(schema: UniversalSchema): DuplicateId[] {
  const locationsById = new Map<string, string[]>()

  const record = (id: string, location: string) => {
    const locations = locationsById.get(id) ?? []
    locations.push(location)
    locationsById.set(id, locations)
  }

  for (const entity of schema.entities) {
    record(entity.id, `entity:${entity.name}`)
  }

  for (const enumDef of schema.enums) {
    record(enumDef.id, `enum:${enumDef.name}`)
  }

  for (const relation of schema.relations) {
    record(relation.id, `relation:${relation.id}`)
  }

  for (const indexDef of schema.indexes) {
    record(indexDef.id, `index:${indexDef.name}`)
  }

  for (const constraint of schema.constraints) {
    record(constraint.id, `constraint:${constraint.id}`)
  }

  return [...locationsById.entries()]
    .filter(([, locations]) => locations.length > 1)
    .map(([id, locations]) => ({ id, locations }))
}
