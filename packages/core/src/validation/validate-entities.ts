import type { Entity, FieldId, UniversalSchema } from "../schema/types.js"
import { findDuplicateIds, issue } from "./helpers.js"
import type { ValidationIssue } from "./types.js"

export interface EntityValidationContext {
  fieldById: Map<FieldId, { entity: Entity; fieldName: string }>
}

/** Validate entity/enum names, duplicate IDs, and missing primary keys. */
export function validateEntities(schema: UniversalSchema): {
  issues: ValidationIssue[]
  context: EntityValidationContext
} {
  const issues: ValidationIssue[] = []
  const fieldById = new Map<FieldId, { entity: Entity; fieldName: string }>()

  for (const entity of schema.entities) {
    if (!entity.name.trim()) {
      issues.push(
        issue(
          "empty_entity_name",
          "Entity name must not be empty.",
          "error",
          `entities.${entity.id}`
        )
      )
    }

    for (const field of entity.fields) {
      fieldById.set(field.id, { entity, fieldName: field.name })
    }
  }

  for (const enumDef of schema.enums) {
    if (!enumDef.name.trim()) {
      issues.push(
        issue(
          "empty_enum_name",
          "Enum name must not be empty.",
          "error",
          `enums.${enumDef.id}`
        )
      )
    }
  }

  for (const duplicate of findDuplicateIds(schema)) {
    issues.push(
      issue(
        "duplicate_id",
        `Duplicate ID "${duplicate.id}" found in ${duplicate.locations.join(", ")}.`,
        "error",
        duplicate.id
      )
    )
  }

  for (const entity of schema.entities) {
    const hasPrimaryKey =
      entity.fields.some((field) => field.isPrimaryKey) ||
      schema.constraints.some(
        (constraint) =>
          constraint.kind === "primary_key" && constraint.entityId === entity.id
      )

    if (!hasPrimaryKey) {
      issues.push(
        issue(
          "missing_primary_key",
          `Entity "${entity.name}" is missing a primary key.`,
          "warning",
          `entities.${entity.id}`
        )
      )
    }
  }

  return { issues, context: { fieldById } }
}
