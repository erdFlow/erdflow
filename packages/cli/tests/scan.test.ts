import assert from "node:assert/strict"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { resolveSchemaSource } from "../src/scan.js"

test("resolveSchemaSource uses explicit --prisma path", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-scan-"))
  const schemaPath = join(rootDir, "custom.prisma")
  await writeFile(schemaPath, "model User { id Int @id }")

  const source = await resolveSchemaSource(rootDir, {
    prisma: "custom.prisma",
  })

  assert.equal(source.adapterName, "prisma")
  assert.equal(source.filePath, schemaPath)
})

test("resolveSchemaSource auto-detects prisma/schema.prisma", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-scan-"))
  const prismaDir = join(rootDir, "prisma")
  await mkdir(prismaDir, { recursive: true })
  await writeFile(join(prismaDir, "schema.prisma"), "model User { id Int @id }")

  const source = await resolveSchemaSource(rootDir)
  assert.equal(source.adapterName, "prisma")
})

test("resolveSchemaSource throws when nothing is found", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-scan-"))

  await assert.rejects(
    () => resolveSchemaSource(rootDir),
    /No schema source found/
  )
})
