import assert from "node:assert/strict"
import test from "node:test"
import {
  createRelationCatalogSchema,
  createSizedSchema,
} from "../../src/testing/index.js"
import { validateSchema } from "../../src/validation/index.js"

test("createSizedSchema rejects invalid counts", () => {
  assert.throws(() => createSizedSchema(0), /positive integer/)
  assert.throws(() => createSizedSchema(-1), /positive integer/)
  assert.throws(() => createSizedSchema(1.5), /positive integer/)
})

for (const size of [5, 25, 100] as const) {
  test(`createSizedSchema(${size}) validates and has chain relations`, () => {
    const schema = createSizedSchema(size)
    assert.equal(schema.entities.length, size)
    assert.equal(schema.relations.length, size - 1)

    const result = validateSchema(schema)
    assert.equal(result.valid, true, JSON.stringify(result.issues, null, 2))
  })
}

test("createRelationCatalogSchema covers expected cardinalities", () => {
  const schema = createRelationCatalogSchema()
  assert.equal(schema.entities.length, 5)

  const cardinalities = new Set(schema.relations.map((r) => r.cardinality))
  assert.ok(cardinalities.has("one-to-one"))
  assert.ok(cardinalities.has("one-to-many"))
  assert.ok(cardinalities.has("many-to-many"))

  const selfRel = schema.relations.find(
    (r) => r.from.entityId === r.to.entityId
  )
  assert.ok(selfRel, "expected self-relation on Category")

  const userPosts = schema.relations.filter(
    (r) =>
      r.to.entityId.includes("user") &&
      r.from.entityId.includes("post") &&
      r.cardinality === "one-to-many"
  )
  assert.ok(
    userPosts.length >= 2,
    "expected multiple relations between Post and User"
  )

  const result = validateSchema(schema)
  assert.equal(result.valid, true, JSON.stringify(result.issues, null, 2))
})
