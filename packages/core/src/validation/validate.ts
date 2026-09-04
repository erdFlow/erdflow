import type { UniversalSchema } from "../schema/types.js"
import type { ValidationResult } from "./types.js"
import { SchemaValidationError } from "./types.js"
import { validateEntities } from "./validate-entities.js"
import { validateIndexes } from "./validate-indexes.js"
import { validateRelations } from "./validate-relations.js"

export function validateSchema(schema: UniversalSchema): ValidationResult {
  const { issues, context } = validateEntities(schema)
  const entityById = new Map(
    schema.entities.map((entity) => [entity.id, entity])
  )

  issues.push(...validateRelations(schema, entityById, context))
  issues.push(...validateIndexes(schema, entityById, context))

  const hasErrors = issues.some((entry) => entry.severity === "error")
  return { valid: !hasErrors, issues }
}

export function assertValidSchema(schema: UniversalSchema): void {
  const result = validateSchema(schema)
  if (!result.valid) {
    throw new SchemaValidationError(
      result.issues.filter((entry) => entry.severity === "error")
    )
  }
}
