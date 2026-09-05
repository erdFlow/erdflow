import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { parsePrismaSchema } from "../src/parse.js"

const catalogPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/relations/catalog.prisma"
)

test("relation catalog parses expected entities and relation shapes", async () => {
  const input = readFileSync(catalogPath, "utf8")
  const schema = await parsePrismaSchema(input, {
    adapter: "prisma",
    source: "relations/catalog.prisma",
  })

  assert.equal(schema.entities.length, 6)
  const names = new Set(schema.entities.map((e) => e.name))
  for (const name of [
    "User",
    "Profile",
    "Post",
    "Category",
    "PostCategory",
    "Tag",
  ]) {
    assert.ok(names.has(name), `missing entity ${name}`)
  }

  const cardinalities = new Set(schema.relations.map((r) => r.cardinality))
  assert.ok(cardinalities.has("one-to-one"))
  assert.ok(cardinalities.has("one-to-many"))

  const selfRel = schema.relations.find(
    (r) => r.from.entityId === r.to.entityId
  )
  assert.ok(selfRel, "expected Category self-relation")

  const postToUser = schema.relations.filter(
    (r) =>
      (r.from.entityId.includes("post") || r.to.entityId.includes("post")) &&
      (r.from.entityId.includes("user") || r.to.entityId.includes("user")) &&
      !r.from.entityId.includes("postcategory") &&
      !r.to.entityId.includes("postcategory")
  )
  assert.ok(
    postToUser.length >= 2,
    `expected multiple Post↔User relations, got ${postToUser.length}`
  )

  // Explicit M:N is modeled as a junction entity with FKs (not implicit many-to-many).
  const junction = schema.entities.find((e) => e.name === "PostCategory")
  assert.ok(junction)
  const junctionRels = schema.relations.filter(
    (r) =>
      r.from.entityId.includes("postcategory") ||
      r.to.entityId.includes("postcategory")
  )
  assert.ok(junctionRels.length >= 2)
})
