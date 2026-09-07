import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { prismaAdapter } from "../src/adapter.js"
import { extractDatasourceProvider } from "../src/parse.js"

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures")

test("extractDatasourceProvider reads provider from datasource", () => {
  const input = readFileSync(join(fixtureDir, "basic.prisma"), "utf8")
  assert.equal(extractDatasourceProvider(input), "postgresql")

  const mongo = readFileSync(join(fixtureDir, "mongodb-basic.prisma"), "utf8")
  assert.equal(extractDatasourceProvider(mongo), "mongodb")
})

test("prismaAdapter sets relational meta and table kind for postgres", async () => {
  const input = readFileSync(join(fixtureDir, "basic.prisma"), "utf8")
  const schema = await prismaAdapter.parse(input, {
    filePath: "basic.prisma",
  })

  assert.equal(schema.meta?.provider, "postgresql")
  assert.equal(schema.meta?.databaseKind, "relational")
  assert.ok(schema.entities.every((entity) => entity.kind === "table"))

  const user = schema.entities.find((entity) => entity.name === "User")
  const id = user?.fields.find((field) => field.name === "id")
  assert.equal(id?.idStrategy, "autoincrement")
})

test("prismaAdapter sets document meta and collection kind for mongodb", async () => {
  const input = readFileSync(join(fixtureDir, "mongodb-basic.prisma"), "utf8")
  const schema = await prismaAdapter.parse(input, {
    filePath: "mongodb-basic.prisma",
  })

  assert.equal(schema.meta?.provider, "mongodb")
  assert.equal(schema.meta?.databaseKind, "document")
  assert.ok(schema.entities.every((entity) => entity.kind === "collection"))

  const user = schema.entities.find((entity) => entity.name === "User")
  const id = user?.fields.find((field) => field.name === "id")
  assert.equal(id?.idStrategy, "objectId")
  assert.equal(id?.type.native, "ObjectId")
})

test("prismaAdapter maps uuid cuid nanoid autoincrement strategies", async () => {
  const input = readFileSync(join(fixtureDir, "id-strategies.prisma"), "utf8")
  const schema = await prismaAdapter.parse(input, {
    filePath: "id-strategies.prisma",
  })

  assert.equal(schema.meta?.provider, "postgresql")
  assert.equal(schema.meta?.databaseKind, "relational")

  const user = schema.entities.find((entity) => entity.name === "User")
  assert.equal(
    user?.fields.find((field) => field.name === "id")?.idStrategy,
    "uuid"
  )
  assert.equal(
    user?.fields.find((field) => field.name === "profileId")?.idStrategy,
    "cuid"
  )

  const post = schema.entities.find((entity) => entity.name === "Post")
  assert.equal(
    post?.fields.find((field) => field.name === "id")?.idStrategy,
    "autoincrement"
  )
  assert.equal(
    post?.fields.find((field) => field.name === "slug")?.idStrategy,
    "nanoid"
  )
})
