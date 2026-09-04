import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { layoutSchema } from "@erdflow/layout"
import { dbmlAdapter } from "@erdflow/parser-dbml"

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures")
const LARGE_TABLE_COUNT = 100
const LAYOUT_TIMEOUT_MS = 15_000

test("large.dbml parses 100 entities with relations", async () => {
  const input = readFileSync(join(fixtureDir, "large.dbml"), "utf8")
  const schema = await dbmlAdapter.parse(input, { filePath: "large.dbml" })

  assert.equal(schema.entities.length, LARGE_TABLE_COUNT)
  assert.equal(schema.relations.length, LARGE_TABLE_COUNT - 1)
})

test("layoutSchema completes for 100-table schema within timeout", async () => {
  const input = readFileSync(join(fixtureDir, "large.dbml"), "utf8")
  const schema = await dbmlAdapter.parse(input, { filePath: "large.dbml" })

  const startedAt = performance.now()
  const result = await layoutSchema(schema)
  const elapsedMs = performance.now() - startedAt

  assert.equal(result.nodes.length, LARGE_TABLE_COUNT)
  assert.equal(result.edges.length, LARGE_TABLE_COUNT - 1)
  assert.ok(
    elapsedMs < LAYOUT_TIMEOUT_MS,
    `layout took ${elapsedMs.toFixed(0)}ms, expected < ${LAYOUT_TIMEOUT_MS}ms`
  )
})
