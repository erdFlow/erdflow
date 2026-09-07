import assert from "node:assert/strict"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { detectLaravelProject } from "../src/detect.js"

const fixtureRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/basic"
)

test("detectLaravelProject accepts fixture with composer + migrations", async () => {
  assert.equal(await detectLaravelProject(fixtureRoot), true)
})

test("detectLaravelProject rejects empty temp dir", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-laravel-"))
  assert.equal(await detectLaravelProject(rootDir), false)
})

test("detectLaravelProject accepts artisan + migrations without composer", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "erdflow-laravel-art-"))
  await mkdir(join(rootDir, "database", "migrations"), { recursive: true })
  await writeFile(join(rootDir, "artisan"), "#!/usr/bin/env php\n")
  await writeFile(
    join(rootDir, "database", "migrations", "2024_01_01_000000_create_x.php"),
    "<?php\n"
  )
  assert.equal(await detectLaravelProject(rootDir), true)
})
