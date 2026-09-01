import type {
  Entity,
  EntityId,
  FieldId,
  UniversalSchema,
} from "../schema/types.js";
import type { ValidationIssue, ValidationResult } from "./types.js";
import { SchemaValidationError } from "./types.js";

function issue(
  code: string,
  message: string,
  severity: ValidationIssue["severity"],
  path?: string,
): ValidationIssue {
  return { code, message, severity, path };
}

function entityFieldMap(entity: Entity): Map<FieldId, string> {
  return new Map(entity.fields.map((field) => [field.id, field.name]));
}

function indexSignature(entityId: EntityId, fieldIds: FieldId[]): string {
  return `${entityId}:${fieldIds.join(",")}`;
}

export function validateSchema(schema: UniversalSchema): ValidationResult {
  const issues: ValidationIssue[] = [];

  const entityById = new Map(schema.entities.map((entity) => [entity.id, entity]));
  const enumById = new Map(schema.enums.map((enumDef) => [enumDef.id, enumDef]));
  const fieldById = new Map<FieldId, { entity: Entity; fieldName: string }>();

  for (const entity of schema.entities) {
    if (!entity.name.trim()) {
      issues.push(
        issue(
          "empty_entity_name",
          "Entity name must not be empty.",
          "error",
          `entities.${entity.id}`,
        ),
      );
    }

    for (const field of entity.fields) {
      fieldById.set(field.id, { entity, fieldName: field.name });
    }
  }

  for (const enumDef of schema.enums) {
    if (!enumDef.name.trim()) {
      issues.push(
        issue(
          "empty_enum_name",
          "Enum name must not be empty.",
          "error",
          `enums.${enumDef.id}`,
        ),
      );
    }
  }

  const duplicateIds = findDuplicateIds(schema);
  for (const duplicate of duplicateIds) {
    issues.push(
      issue(
        "duplicate_id",
        `Duplicate ID "${duplicate.id}" found in ${duplicate.locations.join(", ")}.`,
        "error",
        duplicate.id,
      ),
    );
  }

  for (const relation of schema.relations) {
    if (!entityById.has(relation.from.entityId)) {
      issues.push(
        issue(
          "missing_entity_reference",
          `Relation "${relation.id}" references missing source entity "${relation.from.entityId}".`,
          "error",
          `relations.${relation.id}.from.entityId`,
        ),
      );
    }

    if (!entityById.has(relation.to.entityId)) {
      issues.push(
        issue(
          "missing_entity_reference",
          `Relation "${relation.id}" references missing target entity "${relation.to.entityId}".`,
          "error",
          `relations.${relation.id}.to.entityId`,
        ),
      );
    }

    for (const fieldId of relation.from.fieldIds ?? []) {
      if (!fieldById.has(fieldId)) {
        issues.push(
          issue(
            "missing_field_reference",
            `Relation "${relation.id}" references missing source field "${fieldId}".`,
            "error",
            `relations.${relation.id}.from.fieldIds`,
          ),
        );
      }
    }

    for (const fieldId of relation.to.fieldIds ?? []) {
      if (!fieldById.has(fieldId)) {
        issues.push(
          issue(
            "missing_field_reference",
            `Relation "${relation.id}" references missing target field "${fieldId}".`,
            "error",
            `relations.${relation.id}.to.fieldIds`,
          ),
        );
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
          `relations.${relation.id}`,
        ),
      );
    }
  }

  for (const indexDef of schema.indexes) {
    const entity = entityById.get(indexDef.entityId);
    if (!entity) {
      issues.push(
        issue(
          "missing_entity_reference",
          `Index "${indexDef.name}" references missing entity "${indexDef.entityId}".`,
          "error",
          `indexes.${indexDef.id}.entityId`,
        ),
      );
      continue;
    }

    const fields = entityFieldMap(entity);
    for (const fieldId of indexDef.fieldIds) {
      if (!fields.has(fieldId)) {
        issues.push(
          issue(
            "missing_field_reference",
            `Index "${indexDef.name}" references missing field "${fieldId}".`,
            "error",
            `indexes.${indexDef.id}.fieldIds`,
          ),
        );
      }
    }
  }

  for (const constraint of schema.constraints) {
    const entity = entityById.get(constraint.entityId);
    if (!entity) {
      issues.push(
        issue(
          "missing_entity_reference",
          `Constraint "${constraint.id}" references missing entity "${constraint.entityId}".`,
          "error",
          `constraints.${constraint.id}.entityId`,
        ),
      );
      continue;
    }

    const fields = entityFieldMap(entity);
    for (const fieldId of constraint.fieldIds) {
      if (!fields.has(fieldId)) {
        issues.push(
          issue(
            "missing_field_reference",
            `Constraint "${constraint.id}" references missing field "${fieldId}".`,
            "error",
            `constraints.${constraint.id}.fieldIds`,
          ),
        );
      }
    }

    if (
      constraint.referencedEntityId &&
      !entityById.has(constraint.referencedEntityId)
    ) {
      issues.push(
        issue(
          "broken_relation",
          `Constraint "${constraint.id}" references missing entity "${constraint.referencedEntityId}".`,
          "warning",
          `constraints.${constraint.id}.referencedEntityId`,
        ),
      );
    }

    if (constraint.referencedFieldIds) {
      for (const fieldId of constraint.referencedFieldIds) {
        if (!fieldById.has(fieldId)) {
          issues.push(
            issue(
              "broken_relation",
              `Constraint "${constraint.id}" references missing field "${fieldId}".`,
              "warning",
              `constraints.${constraint.id}.referencedFieldIds`,
            ),
          );
        }
      }
    }
  }

  for (const entity of schema.entities) {
    const hasPrimaryKey =
      entity.fields.some((field) => field.isPrimaryKey) ||
      schema.constraints.some(
        (constraint) =>
          constraint.kind === "primary_key" &&
          constraint.entityId === entity.id,
      );

    if (!hasPrimaryKey) {
      issues.push(
        issue(
          "missing_primary_key",
          `Entity "${entity.name}" is missing a primary key.`,
          "warning",
          `entities.${entity.id}`,
        ),
      );
    }
  }

  const seenIndexSignatures = new Map<string, string>();
  for (const indexDef of schema.indexes) {
    const signature = indexSignature(indexDef.entityId, indexDef.fieldIds);
    const existing = seenIndexSignatures.get(signature);
    if (existing) {
      issues.push(
        issue(
          "duplicate_index",
          `Duplicate index on entity "${indexDef.entityId}" for fields [${indexDef.fieldIds.join(", ")}].`,
          "warning",
          `indexes.${indexDef.id}`,
        ),
      );
    } else {
      seenIndexSignatures.set(signature, indexDef.id);
    }
  }

  // Ensure enum IDs are unique in duplicate check scope.
  void enumById;

  const hasErrors = issues.some((entry) => entry.severity === "error");
  return { valid: !hasErrors, issues };
}

export function assertValidSchema(schema: UniversalSchema): void {
  const result = validateSchema(schema);
  if (!result.valid) {
    throw new SchemaValidationError(
      result.issues.filter((entry) => entry.severity === "error"),
    );
  }
}

interface DuplicateId {
  id: string;
  locations: string[];
}

function findDuplicateIds(schema: UniversalSchema): DuplicateId[] {
  const locationsById = new Map<string, string[]>();

  const record = (id: string, location: string) => {
    const locations = locationsById.get(id) ?? [];
    locations.push(location);
    locationsById.set(id, locations);
  };

  for (const entity of schema.entities) {
    record(entity.id, `entity:${entity.name}`);
  }

  for (const enumDef of schema.enums) {
    record(enumDef.id, `enum:${enumDef.name}`);
  }

  for (const relation of schema.relations) {
    record(relation.id, `relation:${relation.id}`);
  }

  for (const indexDef of schema.indexes) {
    record(indexDef.id, `index:${indexDef.name}`);
  }

  for (const constraint of schema.constraints) {
    record(constraint.id, `constraint:${constraint.id}`);
  }

  return [...locationsById.entries()]
    .filter(([, locations]) => locations.length > 1)
    .map(([id, locations]) => ({ id, locations }));
}
