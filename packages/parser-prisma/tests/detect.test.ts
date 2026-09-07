import assert from "node:assert/strict"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import {
  detectPrismaProject,
  loadPrismaDatamodel,
  parsePrismaSchema,
  parsePrismaSchemaFromLocation,
  readPrismaConfigSchemaPath,
  resolvePrismaSchemaLocation,
} from "../src/index.js"

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures")

test("detectPrismaProject finds config-driven and multi-file layouts", async () => {
  assert.equal(
    await detectPrismaProject(join(fixtureDir, "v7-multifile")),
    true
  )
  assert.equal(
    await detectPrismaProject(join(fixtureDir, "v7-config-custom")),
    true
  )
})

test("readPrismaConfigSchemaPath extracts schema path statically", async () => {
  const found = await readPrismaConfigSchemaPath(
    join(fixtureDir, "v7-multifile")
  )
  assert.ok(found)
  assert.equal(found.schemaPath, "prisma/schema")
  assert.ok(found.configPath.endsWith("prisma.config.ts"))
})

test("resolvePrismaSchemaLocation uses prisma.config for custom path", async () => {
  const location = await resolvePrismaSchemaLocation(
    join(fixtureDir, "v7-config-custom")
  )
  assert.ok(location)
  assert.equal(location.source, "prisma-config")
  assert.equal(location.files.length, 1)
  assert.ok(location.files[0]?.endsWith(join("db", "schema.prisma")))
})

test("resolvePrismaSchemaLocation expands multi-file schema directory", async () => {
  const location = await resolvePrismaSchemaLocation(
    join(fixtureDir, "v7-multifile")
  )
  assert.ok(location)
  assert.equal(location.source, "prisma-config")
  assert.equal(location.files.length, 3)
  assert.ok(location.files.every((f) => f.endsWith(".prisma")))
})

test("loadPrismaDatamodel concatenates multi-file schemas", async () => {
  const location = await resolvePrismaSchemaLocation(
    join(fixtureDir, "v7-multifile")
  )
  assert.ok(location)
  const datamodel = await loadPrismaDatamodel(location.files)
  assert.match(datamodel, /model User/)
  assert.match(datamodel, /model Post/)
  assert.match(datamodel, /generator client/)
})

test("parsePrismaSchemaFromLocation parses multi-file project", async () => {
  const location = await resolvePrismaSchemaLocation(
    join(fixtureDir, "v7-multifile")
  )
  assert.ok(location)
  const schema = await parsePrismaSchemaFromLocation(location, {
    adapter: "prisma",
  })
  assert.equal(schema.entities.length, 2)
  assert.ok(schema.relations.length >= 1)
  assert.ok(schema.entities.some((e) => e.name === "User"))
  assert.ok(schema.entities.some((e) => e.name === "Post"))
})

test("parsePrismaSchema accepts v6 classic fixture", async () => {
  const { readFileSync } = await import("node:fs")
  const input = readFileSync(
    join(fixtureDir, "v6-classic/schema.prisma"),
    "utf8"
  )
  const schema = await parsePrismaSchema(input, { adapter: "prisma" })
  assert.equal(schema.entities.length, 2)
})

test("parsePrismaSchema accepts v7 url-less datasource", async () => {
  const { readFileSync } = await import("node:fs")
  const input = readFileSync(
    join(fixtureDir, "v7-url-less/schema.prisma"),
    "utf8"
  )
  const schema = await parsePrismaSchema(input, { adapter: "prisma" })
  assert.equal(schema.entities.length, 2)
  assert.ok(schema.relations.length >= 1)
})
