import assert from "node:assert/strict"
import test from "node:test"
import {
  createEntityId,
  createEnumId,
  createFieldId,
  createRelationId,
  type UniversalSchema,
} from "@erdflow/core"
import { clearLayoutCache, layoutSchema } from "../src/index.js"

function table(
  name: string,
  extraFields: string[] = []
): UniversalSchema["entities"][number] {
  return {
    id: createEntityId(name),
    name,
    kind: "table",
    fields: [
      {
        id: createFieldId(name, "id"),
        name: "id",
        type: { name: "Int" },
        nullable: false,
        isPrimaryKey: true,
      },
      ...extraFields.map((fieldName) => ({
        id: createFieldId(name, fieldName),
        name: fieldName,
        type: { name: "Int" },
        nullable: false,
      })),
    ],
  }
}

function enumDef(
  name: string,
  values: string[]
): UniversalSchema["enums"][number] {
  return {
    id: createEnumId(name),
    name,
    values,
  }
}

function relation(
  fromName: string,
  toName: string,
  fieldName: string
): UniversalSchema["relations"][number] {
  return {
    id: createRelationId(fromName, toName, fieldName),
    from: {
      entityId: createEntityId(fromName),
      fieldIds: [createFieldId(fromName, fieldName)],
    },
    to: {
      entityId: createEntityId(toName),
      fieldIds: [createFieldId(toName, "id")],
    },
    cardinality: "one-to-many",
  }
}

test("layoutSchema stacks isolated tables above enums in separate bands", async () => {
  clearLayoutCache()
  const schema: UniversalSchema = {
    entities: [
      table("Users", ["email"]),
      table("Orders", ["userId"]),
      table("WebhookEvent"),
      table("ContactMessage"),
    ],
    enums: [
      enumDef("QuestionType", ["SINGLE", "MULTI"]),
      enumDef("RequestStatus", ["DRAFT", "PUBLISHED"]),
    ],
    relations: [relation("Orders", "Users", "userId")],
    indexes: [],
    constraints: [],
  }

  const result = await layoutSchema(schema)
  assert.equal(
    result.nodes.length,
    schema.entities.length + schema.enums.length
  )
  assert.equal(result.edges.length, schema.relations.length)

  const isolated = result.nodes.filter(
    (node) =>
      node.id === createEntityId("WebhookEvent") ||
      node.id === createEntityId("ContactMessage")
  )
  const enums = result.nodes.filter((node) => node.kind === "enum")
  const connected = result.nodes.filter(
    (node) =>
      node.id === createEntityId("Users") ||
      node.id === createEntityId("Orders")
  )

  assert.equal(isolated.length, 2)
  assert.equal(enums.length, 2)
  assert.equal(connected.length, 2)

  const connectedBottom = Math.max(
    ...connected.map((node) => node.y + node.height)
  )
  const isolatedTop = Math.min(...isolated.map((node) => node.y))
  const isolatedBottom = Math.max(
    ...isolated.map((node) => node.y + node.height)
  )
  const enumTop = Math.min(...enums.map((node) => node.y))

  assert.ok(
    isolatedTop >= connectedBottom,
    `isolated tables should sit below connected core (isolatedTop=${isolatedTop}, connectedBottom=${connectedBottom})`
  )
  assert.ok(
    enumTop >= isolatedBottom,
    `enums should sit below isolated tables (enumTop=${enumTop}, isolatedBottom=${isolatedBottom})`
  )
})

test("layoutSchema places orphans-only schema without throwing", async () => {
  clearLayoutCache()
  const schema: UniversalSchema = {
    entities: [table("WebhookEvent"), table("SetupFee")],
    enums: [enumDef("Status", ["A", "B"]), enumDef("Kind", ["X", "Y"])],
    relations: [],
    indexes: [],
    constraints: [],
  }

  const result = await layoutSchema(schema)
  assert.equal(result.nodes.length, 4)
  assert.equal(result.edges.length, 0)

  const tables = result.nodes.filter((node) => node.kind === "entity")
  const enums = result.nodes.filter((node) => node.kind === "enum")
  assert.equal(tables.length, 2)
  assert.equal(enums.length, 2)

  const tableBottom = Math.max(...tables.map((node) => node.y + node.height))
  const enumTop = Math.min(...enums.map((node) => node.y))
  assert.ok(enumTop >= tableBottom)
})

test("layoutSchema places enums-only schema without throwing", async () => {
  clearLayoutCache()
  const schema: UniversalSchema = {
    entities: [],
    enums: [
      enumDef("QuestionType", ["SINGLE", "MULTI"]),
      enumDef("RequestStatus", ["DRAFT"]),
    ],
    relations: [],
    indexes: [],
    constraints: [],
  }

  const result = await layoutSchema(schema)
  assert.equal(result.nodes.length, 2)
  assert.ok(result.nodes.every((node) => node.kind === "enum"))
})
