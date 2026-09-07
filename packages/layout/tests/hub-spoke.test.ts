import assert from "node:assert/strict"
import test from "node:test"
import {
  createEntityId,
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

/**
 * Hub with ≥7 exclusive leaves → deg(hub) > max(3*median, 6) so leaf extraction runs.
 */
function createHubSpokeSchema(leafCount: number): UniversalSchema {
  const hub = table("User", ["email"])
  const leaves = Array.from({ length: leafCount }, (_, i) =>
    table(`Leaf${i}`, ["userId"])
  )
  const relations = leaves.map((_, i) => relation(`Leaf${i}`, "User", "userId"))

  return {
    entities: [hub, ...leaves],
    enums: [],
    relations,
    indexes: [],
    constraints: [],
  }
}

/** Chain Table0→…→TableN — no hub above threshold; leaves should not peel as a group. */
function createChainSchema(count: number): UniversalSchema {
  const entities = Array.from({ length: count }, (_, i) => {
    const fields = i === 0 ? [] : ["parentId"]
    return table(`Table${i}`, fields)
  })
  const relations = []
  for (let i = 1; i < count; i += 1) {
    relations.push(relation(`Table${i}`, `Table${i - 1}`, "parentId"))
  }
  return {
    entities,
    enums: [],
    relations,
    indexes: [],
    constraints: [],
  }
}

test("layoutSchema clusters exclusive hub leaves near the hub", async () => {
  clearLayoutCache()
  const leafCount = 7
  const schema = createHubSpokeSchema(leafCount)
  const result = await layoutSchema(schema)

  assert.equal(result.nodes.length, schema.entities.length)
  assert.equal(result.edges.length, schema.relations.length)

  const hub = result.nodes.find((node) => node.id === createEntityId("User"))
  assert.ok(hub)

  const leafNodes = result.nodes.filter((node) =>
    /^entity:leaf\d+$/.test(node.id)
  )
  assert.equal(leafNodes.length, leafCount)

  // Satellites should sit in a compact grid beside the hub, not far away.
  const hubCx = hub.x + hub.width / 2
  const hubCy = hub.y + hub.height / 2
  let maxDist = 0
  for (const leaf of leafNodes) {
    const lx = leaf.x + leaf.width / 2
    const ly = leaf.y + leaf.height / 2
    const dist = Math.hypot(lx - hubCx, ly - hubCy)
    maxDist = Math.max(maxDist, dist)
  }

  // Grid of 7 (~3×3) entity boxes (~248) + gaps → well under a layered fan-out.
  assert.ok(maxDist < 900, `expected leaves near hub, maxDist=${maxDist}`)

  const leafXs = leafNodes.map((n) => n.x)
  const leafYs = leafNodes.map((n) => n.y)
  const spanX = Math.max(...leafXs) - Math.min(...leafXs)
  const spanY = Math.max(...leafYs) - Math.min(...leafYs)
  assert.ok(spanX < 800, `leaf grid spanX=${spanX}`)
  assert.ok(spanY < 800, `leaf grid spanY=${spanY}`)
})

test("layoutSchema does not peel a plain chain", async () => {
  clearLayoutCache()
  const schema = createChainSchema(8)
  const result = await layoutSchema(schema)

  assert.equal(result.nodes.length, schema.entities.length)
  assert.equal(result.edges.length, schema.relations.length)

  for (const entity of schema.entities) {
    assert.ok(result.nodes.some((node) => node.id === entity.id))
  }
})
