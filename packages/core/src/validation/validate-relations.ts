import type { Entity, EntityId, UniversalSchema } from "../schema/types.js"
import { issue } from "./helpers.js"
import type { ValidationIssue } from "./types.js"
import type { EntityValidationContext } from "./validate-entities.js"

/** Validate relation entity/field references. */
export function validateRelations(
  schema: UniversalSchema,
  entityById: Map<EntityId, Entity>,
  context: EntityValidationContext
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const { fieldById } = context

  for (const relation of schema.relations) {
    if (!entityById.has(relation.from.entityId)) {
      issues.push(
        issue(
          "missing_entity_reference",
          `Relation "${relation.id}" references missing source entity "${relation.from.entityId}".`,
          "error",
          `relations.${relation.id}.from.entityId`
        )
      )
    }

    if (!entityById.has(relation.to.entityId)) {
      issues.push(
        issue(
          "missing_entity_reference",
          `Relation "${relation.id}" references missing target entity "${relation.to.entityId}".`,
          "error",
          `relations.${relation.id}.to.entityId`
        )
      )
    }

    for (const fieldId of relation.from.fieldIds ?? []) {
      if (!fieldById.has(fieldId)) {
        issues.push(
          issue(
            "missing_field_reference",
            `Relation "${relation.id}" references missing source field "${fieldId}".`,
            "error",
            `relations.${relation.id}.from.fieldIds`
          )
        )
      }
    }

    for (const fieldId of relation.to.fieldIds ?? []) {
      if (!fieldById.has(fieldId)) {
        issues.push(
          issue(
            "missing_field_reference",
            `Relation "${relation.id}" references missing target field "${fieldId}".`,
            "error",
            `relations.${relation.id}.to.fieldIds`
          )
        )
      }
    }

    if (
      relation.from.entityId !== relation.to.entityId &&
      !entityById.has(relation.to.entityId)
    ) {
      issues.push(
        issue(
          "broken_relation",
          `Relation "${relation.id}" points to a missing entity.`,
          "warning",
          `relations.${relation.id}`
        )
      )
    }
  }

  return issues
}
