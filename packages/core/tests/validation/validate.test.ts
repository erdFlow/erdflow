import assert from "node:assert/strict";
import test from "node:test";
import {
  createEntityId,
  createFieldId,
  createRelationId,
  type UniversalSchema,
} from "../../src/schema/index.js";
import {
  assertValidSchema,
  SchemaValidationError,
  validateSchema,
} from "../../src/validation/index.js";

function createValidSchema(): UniversalSchema {
  const usersId = createEntityId("Users");
  const ordersId = createEntityId("Orders");
  const usersIdField = createFieldId("Users", "id");
  const ordersIdField = createFieldId("Orders", "id");
  const ordersUserIdField = createFieldId("Orders", "userId");

  return {
    entities: [
      {
        id: usersId,
        name: "Users",
        kind: "table",
        fields: [
          {
            id: usersIdField,
            name: "id",
            type: { name: "Int" },
            nullable: false,
            isPrimaryKey: true,
          },
        ],
      },
      {
        id: ordersId,
        name: "Orders",
        kind: "table",
        fields: [
          {
            id: ordersIdField,
            name: "id",
            type: { name: "Int" },
            nullable: false,
            isPrimaryKey: true,
          },
          {
            id: ordersUserIdField,
            name: "userId",
            type: { name: "Int" },
            nullable: false,
          },
        ],
      },
    ],
    enums: [],
    relations: [
      {
        id: createRelationId("Orders", "Users", "userId"),
        from: { entityId: ordersId, fieldIds: [ordersUserIdField] },
        to: { entityId: usersId, fieldIds: [usersIdField] },
        cardinality: "one-to-many",
      },
    ],
    indexes: [],
    constraints: [],
  };
}

test("validateSchema accepts a valid minimal schema", () => {
  const result = validateSchema(createValidSchema());
  assert.equal(result.valid, true);
  assert.equal(result.issues.length, 0);
});

test("validateSchema rejects duplicate entity ids", () => {
  const schema = createValidSchema();
  schema.entities.push({
    ...schema.entities[0]!,
    name: "UsersCopy",
  });

  const result = validateSchema(schema);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === "duplicate_id"));
});

test("validateSchema rejects relations with missing entity or field refs", () => {
  const schema = createValidSchema();
  schema.relations.push({
    id: createRelationId("Orders", "Missing"),
    from: {
      entityId: schema.entities[1]!.id,
      fieldIds: [createFieldId("Orders", "missingField")],
    },
    to: {
      entityId: createEntityId("Missing"),
      fieldIds: [createFieldId("Missing", "id")],
    },
    cardinality: "one-to-many",
  });

  const result = validateSchema(schema);
  assert.equal(result.valid, false);
  assert.ok(
    result.issues.some((issue) => issue.code === "missing_entity_reference"),
  );
  assert.ok(
    result.issues.some((issue) => issue.code === "missing_field_reference"),
  );
});

test("validateSchema warns on missing primary key; assertValidSchema throws only on errors", () => {
  const schema = createValidSchema();
  schema.entities[0]!.fields[0]!.isPrimaryKey = false;

  const result = validateSchema(schema);
  assert.equal(result.valid, true);
  assert.ok(
    result.issues.some(
      (issue) =>
        issue.code === "missing_primary_key" && issue.severity === "warning",
    ),
  );

  assert.doesNotThrow(() => assertValidSchema(schema));

  schema.entities.push({
    ...schema.entities[0]!,
    name: "Dup",
  });
  assert.throws(() => assertValidSchema(schema), SchemaValidationError);
});
