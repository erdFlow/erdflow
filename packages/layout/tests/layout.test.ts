import assert from "node:assert/strict"
import test from "node:test"
import {
  createEntityId,
  createEnumId,
  createFieldId,
  createRelationId,
  type UniversalSchema,
} from "@erdflow/core"
import {
  clearLayoutCache,
  defaultLayoutCache,
  layoutSchema,
  schemaTopologyHash,
} from "../src/index.js"

function createBasicSchema(): UniversalSchema {
  const usersId = createEntityId("Users")
  const ordersId = createEntityId("Orders")
  const statusEnumId = createEnumId("OrderStatus")
  const usersIdField = createFieldId("Users", "id")
  const ordersIdField = createFieldId("Orders", "id")
  const ordersUserIdField = createFieldId("Orders", "userId")

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
          {
            id: createFieldId("Users", "email"),
            name: "email",
            type: { name: "String" },
            nullable: false,
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
    enums: [
      {
        id: statusEnumId,
        name: "OrderStatus",
        values: ["pending", "paid", "cancelled"],
      },
    ],
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
  }
}

test("layoutSchema produces nodes for all entities and enums", async () => {
  clearLayoutCache()
  const schema = createBasicSchema()
  const result = await layoutSchema(schema)

  assert.equal(
    result.nodes.length,
    schema.entities.length + schema.enums.length
  )

  const positions = result.nodes.map((node) => `${node.x},${node.y}`)
  assert.equal(new Set(positions).size, positions.length)

  for (const entity of schema.entities) {
    const node = result.nodes.find((candidate) => candidate.id === entity.id)
    assert.ok(node, `missing node for entity ${entity.id}`)
    if (!node) continue
    assert.equal(node.kind, "entity")
    assert.ok(node.width > 0)
    assert.ok(node.height > 0)
  }

  for (const enumDef of schema.enums) {
    const node = result.nodes.find((candidate) => candidate.id === enumDef.id)
    assert.ok(node, `missing node for enum ${enumDef.id}`)
    if (!node) continue
    assert.equal(node.kind, "enum")
  }
})

test("layoutSchema produces edges for relations", async () => {
  clearLayoutCache()
  const schema = createBasicSchema()
  const result = await layoutSchema(schema)

  assert.equal(result.edges.length, schema.relations.length)

  for (const relation of schema.relations) {
    const edge = result.edges.find((candidate) => candidate.id === relation.id)
    assert.ok(edge, `missing edge for relation ${relation.id}`)
    if (!edge) continue
    assert.equal(edge.sourceId, relation.from.entityId)
    assert.equal(edge.targetId, relation.to.entityId)
  }
})

test("layoutSchema returns cached result on second call", async () => {
  clearLayoutCache()
  const schema = createBasicSchema()

  const first = await layoutSchema(schema)
  const second = await layoutSchema(schema)

  assert.equal(first, second)
  assert.equal(defaultLayoutCache.size, 1)
})

test("layoutSchema recomputes when topology changes", async () => {
  clearLayoutCache()
  const schema = createBasicSchema()
  const firstHash = schemaTopologyHash(schema)

  const first = await layoutSchema(schema)

  const users = schema.entities[0]
  const orders = schema.entities[1]
  assert.ok(users)
  assert.ok(orders)

  const modifiedSchema = {
    ...schema,
    relations: [
      ...schema.relations,
      {
        id: createRelationId("Orders", "Users", "reverse"),
        from: { entityId: users.id },
        to: { entityId: orders.id },
        cardinality: "one-to-many" as const,
      },
    ],
  }

  const secondHash = schemaTopologyHash(modifiedSchema)
  assert.notEqual(firstHash, secondHash)

  const second = await layoutSchema(modifiedSchema)
  assert.notEqual(first, second)
  assert.equal(defaultLayoutCache.size, 2)
})

test("schemaTopologyHash is stable for identical schema", () => {
  const schema = createBasicSchema()
  assert.equal(schemaTopologyHash(schema), schemaTopologyHash(schema))
})
