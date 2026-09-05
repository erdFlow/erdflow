import assert from "node:assert/strict"
import test from "node:test"
import { parsePrismaSchema } from "../src/parse.js"
import { generateSizedPrismaSchema } from "./helpers/sized-prisma.js"

const BUDGETS_MS = {
  5: 2_000,
  25: 5_000,
  100: 15_000,
  200: 30_000,
} as const

for (const size of [5, 25, 100, 200] as const) {
  test(`parsePrismaSchema completes for ${size} models within budget`, async () => {
    const input = generateSizedPrismaSchema(size)
    const budgetMs = BUDGETS_MS[size]

    const startedAt = performance.now()
    const schema = await parsePrismaSchema(input, {
      adapter: "prisma",
      source: `sized:${size}`,
    })
    const elapsedMs = performance.now() - startedAt

    assert.equal(schema.entities.length, size)
    assert.ok(schema.relations.length >= size - 1)
    assert.ok(
      elapsedMs < budgetMs,
      `parse(${size}) took ${elapsedMs.toFixed(0)}ms, expected < ${budgetMs}ms`
    )
  })
}
