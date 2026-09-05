import assert from "node:assert/strict"
import test from "node:test"
import { createSizedSchema } from "@erdflow/core/testing"
import { clearLayoutCache, layoutSchema } from "../src/index.js"

const BUDGETS_MS = {
  5: 500,
  25: 2_000,
  100: 15_000,
  200: 30_000,
} as const

const XL_HEAP_CEILING_BYTES = 256 * 1024 * 1024

for (const size of [5, 25, 100, 200] as const) {
  test(`layoutSchema completes for ${size} entities within budget`, async () => {
    clearLayoutCache()
    const schema = createSizedSchema(size)
    const budgetMs = BUDGETS_MS[size]

    const startedAt = performance.now()
    const result = await layoutSchema(schema)
    const elapsedMs = performance.now() - startedAt

    assert.equal(result.nodes.length, size)
    assert.equal(result.edges.length, size - 1)
    assert.ok(
      elapsedMs < budgetMs,
      `layout(${size}) took ${elapsedMs.toFixed(0)}ms, expected < ${budgetMs}ms`
    )
  })
}

test("layoutSchema XL heap delta stays under soft ceiling", async () => {
  clearLayoutCache()
  if (typeof globalThis.gc === "function") {
    globalThis.gc()
  }

  const before = process.memoryUsage().heapUsed
  const schema = createSizedSchema(200)
  const result = await layoutSchema(schema)
  const after = process.memoryUsage().heapUsed
  const delta = after - before

  assert.equal(result.nodes.length, 200)
  assert.ok(
    delta < XL_HEAP_CEILING_BYTES,
    `heap delta ${(delta / (1024 * 1024)).toFixed(1)}MB exceeds ${XL_HEAP_CEILING_BYTES / (1024 * 1024)}MB ceiling`
  )
})
