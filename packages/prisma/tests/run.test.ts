import assert from "node:assert/strict"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { startSession } from "../src/run.js"

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public")

const BASIC_PRISMA = `generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
}
`

async function writePrismaProject(): Promise<string> {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-run-"))
  await mkdir(join(rootDir, "prisma"))
  await writeFile(join(rootDir, "prisma", "schema.prisma"), BASIC_PRISMA)
  return rootDir
}

test("startSession serves parsed Prisma schema over HTTP", async () => {
  const rootDir = await writePrismaProject()
  const session = await startSession({
    rootDir,
    port: 0,
    watch: false,
    publicDir,
    printSummary: false,
  })

  try {
    assert.equal(session.schema.entities.length, 1)
    const response = await fetch(`${session.url}api/schema`)
    assert.equal(response.status, 200)
    const body = (await response.json()) as {
      entities: Array<{ name: string }>
    }
    assert.equal(body.entities.length, 1)
    assert.equal(body.entities[0]?.name, "User")
  } finally {
    await session.close()
  }
})

test("startSession rejects invalid Prisma schema", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-run-bad-"))
  await mkdir(join(rootDir, "prisma"))
  await writeFile(
    join(rootDir, "prisma", "schema.prisma"),
    `generator client { provider = "prisma-client-js" }\nmodel User {`
  )

  await assert.rejects(
    () =>
      startSession({
        rootDir,
        port: 0,
        watch: false,
        publicDir,
        printSummary: false,
      }),
    (error: unknown) => {
      assert.ok(error instanceof Error)
      return true
    }
  )
})
