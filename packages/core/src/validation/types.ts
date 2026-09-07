export type ValidationSeverity = "error" | "warning"

export type ValidationIssueCode =
  | "duplicate_id"
  | "empty_entity_name"
  | "empty_enum_name"
  | "missing_primary_key"
  | "missing_entity_reference"
  | "missing_field_reference"
  | "broken_relation"
  | "duplicate_index"

export interface ValidationIssue {
  code: ValidationIssueCode
  message: string
  severity: ValidationSeverity
  path?: string
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
}

export class SchemaValidationError extends Error {
  readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[]) {
    const messages = issues.map((issue) => issue.message).join("; ")
    super(`Schema validation failed: ${messages}`)
    this.name = "SchemaValidationError"
    this.issues = issues
  }
}
