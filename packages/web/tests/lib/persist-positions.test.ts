import assert from "node:assert/strict"
import test from "node:test"
import {
  MANUAL_POSITIONS_STORAGE_KEY_PREFIX,
  MANUAL_POSITIONS_TTL_MS,
} from "../../src/data/constants.js"
import {
  loadManualPositions,
  positionsSchemaKey,
  saveManualPositions,
} from "../../src/lib/persist-positions.js"

const memory = new Map<string, string>()

function installLocalStorageMock(): void {
  memory.clear()
  const localStorageMock = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value)
    },
    removeItem: (key: string) => {
      memory.delete(key)
    },
  }
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageMock,
    configurable: true,
  })
}

test("positionsSchemaKey prefers source path", () => {
  assert.equal(
    positionsSchemaKey({
      source: "/proj/schema.prisma",
      adapter: "prisma",
      entityIds: ["a", "b"],
    }),
    "/proj/schema.prisma"
  )
})

test("save and load manual positions round-trip", () => {
  installLocalStorageMock()
  const key = "fixture:schema"
  saveManualPositions(key, { "entity:user": { x: 10, y: 20 } })

  const loaded = loadManualPositions(key)
  assert.deepEqual(loaded, { "entity:user": { x: 10, y: 20 } })
  assert.ok(memory.has(`${MANUAL_POSITIONS_STORAGE_KEY_PREFIX}:${key}`))
})

test("loadManualPositions drops expired entries", () => {
  installLocalStorageMock()
  const key = "expired:schema"
  const storageKey = `${MANUAL_POSITIONS_STORAGE_KEY_PREFIX}:${key}`
  memory.set(
    storageKey,
    JSON.stringify({
      v: 1,
      expiresAt: Date.now() - 1,
      positions: { "entity:user": { x: 1, y: 2 } },
    })
  )

  assert.deepEqual(loadManualPositions(key), {})
  assert.equal(memory.has(storageKey), false)
})

test("TTL constant is seven days", () => {
  assert.equal(MANUAL_POSITIONS_TTL_MS, 7 * 24 * 60 * 60 * 1000)
})
