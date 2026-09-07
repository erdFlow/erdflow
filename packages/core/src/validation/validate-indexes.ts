import type { Entity, EntityId, UniversalSchema } from "../schema/types.js"
import { entityFieldMap, indexSignature, issue } from "./helpers.js"
import type { ValidationIssue } from "./types.js"
import type { EntityValidationContext } from "./validate-entities.js"

/** Validate indexes, constraints, and duplicate index signatures. */
export function validateIndexes(
  schema: UniversalSchema,
  entityById: Map<EntityId, Entity>,
  context: EntityValidationContext
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const { fieldById } = context

  for (const indexDef of schema.indexes) {
    const entity = entityById.get(indexDef.entityId)
    if (!entity) {
      issues.push(
        issue(
          "missing_entity_reference",
          `Index "${indexDef.name}" references missing entity "${indexDef.entityId}".`,
          "error",
          `indexes.${indexDef.id}.entityId`
        )
      )
      continue
    }

    const fields = entityFieldMap(entity)
    for (const fieldId of indexDef.fieldIds) {
      if (!fields.has(fieldId)) {
        issues.push(
          issue(
            "missing_field_reference",
            `Index "${indexDef.name}" references missing field "${fieldId}".`,
            "error",
            `indexes.${indexDef.id}.fieldIds`
          )
        )
      }
    }
  }

  for (const constraint of schema.constraints) {
    const entity = entityById.get(constraint.entityId)
    if (!entity) {
      issues.push(
        issue(
          "missing_entity_reference",
          `Constraint "${constraint.id}" references missing entity "${constraint.entityId}".`,
          "error",
          `constraints.${constraint.id}.entityId`
        )
      )
      continue
    }

    const fields = entityFieldMap(entity)
    for (const fieldId of constraint.fieldIds) {
      if (!fields.has(fieldId)) {
        issues.push(
          issue(
            "missing_field_reference",
            `Constraint "${constraint.id}" references missing field "${fieldId}".`,
            "error",
            `constraints.${constraint.id}.fieldIds`
          )
        )
      }
    }

    if (constraint.kind === "foreign_key") {
      if (!entityById.has(constraint.referencedEntityId)) {
        issues.push(
          issue(
            "broken_relation",
            `Constraint "${constraint.id}" references missing entity "${constraint.referencedEntityId}".`,
            "warning",
            `constraints.${constraint.id}.referencedEntityId`
          )
        )
      }

      for (const fieldId of constraint.referencedFieldIds) {
        if (!fieldById.has(fieldId)) {
          issues.push(
            issue(
              "broken_relation",
              `Constraint "${constraint.id}" references missing field "${fieldId}".`,
              "warning",
              `constraints.${constraint.id}.referencedFieldIds`
            )
          )
        }
      }
    }
  }

  const seenIndexSignatures = new Map<string, string>()
  for (const indexDef of schema.indexes) {
    const signature = indexSignature(indexDef.entityId, indexDef.fieldIds)
    const existing = seenIndexSignatures.get(signature)
    if (existing) {
      issues.push(
        issue(
          "duplicate_index",
          `Duplicate index on entity "${indexDef.entityId}" for fields [${indexDef.fieldIds.join(", ")}].`,
          "warning",
          `indexes.${indexDef.id}`
        )
      )
    } else {
      seenIndexSignatures.set(signature, indexDef.id)
    }
  }

  return issues
}
