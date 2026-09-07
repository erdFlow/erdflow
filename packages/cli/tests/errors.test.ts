import assert from "node:assert/strict"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { loadSchema } from "../src/parse-source.js"
import { resolveSchemaSource } from "../src/scan.js"

test("resolveSchemaSource rejects missing explicit prisma path", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-err-"))
  await assert.rejects(
    () => resolveSchemaSource(rootDir, { prisma: "does-not-exist.prisma" }),
    /Prisma schema file not found/
  )
})

test("loadSchema rejects invalid prisma content without crashing", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-err-"))
  const schemaPath = join(rootDir, "bad.prisma")
  await writeFile(
    schemaPath,
    `generator client { provider = "prisma-client-js" }\nmodel User {`
  )

  const source = await resolveSchemaSource(rootDir, { prisma: schemaPath })
  await assert.rejects(
    () => loadSchema(source),
    (error: unknown) => {
      assert.ok(error instanceof Error)
      return true
    }
  )
})
