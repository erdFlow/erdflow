import assert from "node:assert/strict"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { watchSchemaSource } from "../src/watch.js"

test("watchSchemaSource fires within 2s after file change", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-watch-"))
  const schemaPath = join(rootDir, "schema.prisma")
  await writeFile(schemaPath, "model User { id Int @id }\n")

  const startedAt = performance.now()
  let resolveChange!: (elapsedMs: number) => void
  let rejectChange!: (error: Error) => void
  const changed = new Promise<number>((resolvePromise, rejectPromise) => {
    resolveChange = resolvePromise
    rejectChange = rejectPromise
  })

  const timeout = setTimeout(() => {
    rejectChange(new Error("watch callback did not fire within 2000ms"))
  }, 2_000)

  const watcher = watchSchemaSource([schemaPath], () => {
    clearTimeout(timeout)
    resolveChange(performance.now() - startedAt)
  })

  await new Promise((r) => setTimeout(r, 150))
  await writeFile(
    schemaPath,
    "model User { id Int @id }\nmodel Post { id Int @id }\n"
  )

  try {
    const elapsedMs = await changed
    assert.ok(
      elapsedMs < 2_000,
      `watch fired after ${elapsedMs.toFixed(0)}ms, expected < 2000ms`
    )
  } finally {
    clearTimeout(timeout)
    await watcher.close()
  }
})
