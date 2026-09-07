import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { createEntityId, validateSchema } from "@erdflow/core"
import { laravelAdapter } from "../src/adapter.js"
import { loadLaravelSchema } from "../src/load.js"

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "../fixtures")

test("laravelAdapter parses a single migration create", async () => {
  const input = readFileSync(
    join(
      fixtures,
      "basic/database/migrations/2024_01_01_000000_create_users_table.php"
    ),
    "utf8"
  )
  const schema = await laravelAdapter.parse(input, {
    filePath: "create_users_table.php",
  })

  assert.equal(schema.entities.length, 1)
  assert.equal(schema.meta?.adapter, "laravel")
  assert.equal(schema.meta?.databaseKind, "relational")

  const users = schema.entities.find((entity) => entity.name === "users")
  assert.ok(users)
  assert.equal(users.id, createEntityId("users"))
  assert.ok(
    users.fields.some((field) => field.name === "email" && field.isUnique)
  )
  assert.ok(
    users.fields.some((field) => field.name === "id" && field.isPrimaryKey)
  )
  assert.ok(users.fields.some((field) => field.name === "created_at"))

  const validation = validateSchema(schema)
  assert.equal(validation.valid, true)
})

test("loadLaravelSchema folds basic fixture into users/posts relation", async () => {
  const schema = await loadLaravelSchema(join(fixtures, "basic"))

  assert.equal(schema.entities.length, 5)
  assert.ok(schema.relations.length >= 1)

  const posts = schema.entities.find((entity) => entity.name === "posts")
  assert.ok(posts)
  assert.ok(posts.fields.some((field) => field.name === "user_id"))

  const relation = schema.relations.find(
    (item) => item.id.includes("posts") && item.id.includes("users")
  )
  assert.ok(relation)
  assert.equal(relation.onDelete, "CASCADE")
  assert.equal(relation.name, "user")

  const softFk = schema.relations.find(
    (item) => item.name === "author" || item.name === "post"
  )
  assert.ok(softFk)

  const m2m = schema.relations.find((item) => item.cardinality === "many-to-many")
  assert.ok(m2m)

  const validation = validateSchema(schema)
  assert.equal(validation.valid, true)
})

test("loadLaravelSchema applies alter migration columns", async () => {
  const schema = await loadLaravelSchema(join(fixtures, "alter"))

  const orders = schema.entities.find((entity) => entity.name === "orders")
  assert.ok(orders)
  assert.ok(orders.fields.some((field) => field.name === "code"))
  assert.ok(orders.fields.some((field) => field.name === "status"))
  assert.ok(orders.fields.some((field) => field.name === "customer_id"))

  // FK to users is skipped when users table is absent from the map
  assert.equal(
    schema.relations.filter((relation) => relation.id.includes("customer"))
      .length,
    0
  )

  const validation = validateSchema(schema)
  assert.equal(validation.valid, true)
})
