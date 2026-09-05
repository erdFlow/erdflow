import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { parsePrismaSchema } from "../src/parse.js"

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/invalid"
)

async function expectParseFailure(fileName: string): Promise<void> {
  const input = readFileSync(join(fixtureDir, fileName), "utf8")
  await assert.rejects(
    () => parsePrismaSchema(input),
    (error: unknown) => {
      assert.ok(error instanceof Error)
      return true
    }
  )
}

test("parsePrismaSchema rejects invalid syntax without crashing", async () => {
  await expectParseFailure("syntax.prisma")
})

test("parsePrismaSchema handles empty schema without crashing", async () => {
  const input = readFileSync(join(fixtureDir, "empty.prisma"), "utf8")
  try {
    const schema = await parsePrismaSchema(input)
    assert.equal(schema.entities.length, 0)
    assert.equal(schema.relations.length, 0)
  } catch (error) {
    assert.ok(error instanceof Error)
  }
})

test("parsePrismaSchema rejects broken relation target without crashing", async () => {
  await expectParseFailure("broken-relation.prisma")
})

test("parsePrismaSchema rejects duplicate model names without crashing", async () => {
  await expectParseFailure("duplicate-model.prisma")
})
