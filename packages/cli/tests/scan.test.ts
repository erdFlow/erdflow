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
  assert.deepEqual(source.schemaFiles, [schemaPath])
  assert.deepEqual(source.watchPaths, [schemaPath])
})

test("resolveSchemaSource auto-detects prisma/schema.prisma", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-scan-"))
  const prismaDir = join(rootDir, "prisma")
  await mkdir(prismaDir, { recursive: true })
  await writeFile(join(prismaDir, "schema.prisma"), "model User { id Int @id }")

  const source = await resolveSchemaSource(rootDir)
  assert.equal(source.adapterName, "prisma")
  assert.equal(source.schemaFiles?.length, 1)
})

test("resolveSchemaSource expands multi-file prisma schema directory", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-scan-"))
  const schemaDir = join(rootDir, "prisma", "schema")
  await mkdir(schemaDir, { recursive: true })
  await writeFile(
    join(schemaDir, "a.prisma"),
    "generator client { provider = \"prisma-client-js\" }\ndatasource db { provider = \"postgresql\" url = env(\"DATABASE_URL\") }"
  )
  await writeFile(join(schemaDir, "b.prisma"), "model User { id Int @id }")

  const source = await resolveSchemaSource(rootDir)
  assert.equal(source.adapterName, "prisma")
  assert.equal(source.schemaFiles?.length, 2)
  assert.equal(source.watchPaths.length, 2)
})

test("resolveSchemaSource follows prisma.config.ts schema path", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-scan-"))
  const dbDir = join(rootDir, "db")
  await mkdir(dbDir, { recursive: true })
  await writeFile(
    join(rootDir, "prisma.config.ts"),
    `export default { schema: "db/schema.prisma" }\n`
  )
  await writeFile(join(dbDir, "schema.prisma"), "model Account { id Int @id }")

  const source = await resolveSchemaSource(rootDir)
  assert.equal(source.adapterName, "prisma")
  assert.ok(source.filePath.endsWith(join("db", "schema.prisma")))
  assert.equal(source.schemaFiles?.length, 1)
  assert.ok(source.watchPaths.some((p) => p.endsWith("prisma.config.ts")))
})

test("resolveSchemaSource throws when nothing is found", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-scan-"))

  await assert.rejects(
    () => resolveSchemaSource(rootDir),
    /No schema source found/
  )
})
