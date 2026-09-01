export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  message: string;
  severity: ValidationSeverity;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export class SchemaValidationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    const messages = issues.map((issue) => issue.message).join("; ");
    super(`Schema validation failed: ${messages}`);
    this.name = "SchemaValidationError";
    this.issues = issues;
  }
}
