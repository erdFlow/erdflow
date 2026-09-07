import assert from "node:assert/strict"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { startSession } from "../src/run.js"

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../parser-laravel/fixtures/basic"
)
const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public")

test("startSession serves Laravel fixture schema over HTTP", async () => {
  const session = await startSession({
    rootDir: fixtureRoot,
    port: 0,
    watch: false,
    publicDir,
    printSummary: false,
  })

  try {
    assert.ok(session.schema.entities.length >= 2)
    const response = await fetch(`${session.url}api/schema`)
    assert.equal(response.status, 200)
    const body = (await response.json()) as {
      entities: Array<{ name: string }>
    }
    assert.ok(body.entities.some((entity) => entity.name === "users"))
    assert.ok(body.entities.some((entity) => entity.name === "posts"))
  } finally {
    await session.close()
  }
})

test("startSession rejects non-Laravel root", async () => {
  await assert.rejects(
    () =>
      startSession({
        rootDir: dirname(fileURLToPath(import.meta.url)),
        port: 0,
        watch: false,
        publicDir,
        printSummary: false,
      }),
    /No Laravel project found/
  )
})
