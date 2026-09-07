import assert from "node:assert/strict"
import test from "node:test"
import {
  finishExportCapture,
  resolveExportSize,
  suggestedDiagramFilename,
} from "../../src/lib/export-diagram.js"
import { useDiagramStore } from "../../src/store/diagram-store.js"

test("resolveExportSize keeps small bounds", () => {
  const size = resolveExportSize({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  })
  assert.equal(size.width, 800)
  assert.equal(size.height, 600)
})

test("resolveExportSize clamps huge bounds under 8192", () => {
  const size = resolveExportSize({
    x: 0,
    y: 0,
    width: 20_000,
    height: 10_000,
  })
  assert.ok(size.width <= 8192)
  assert.ok(size.height <= 8192)
  assert.ok(size.width / size.height - 2 < 0.01)
})

test("suggestedDiagramFilename uses schema source basename", () => {
  assert.equal(
    suggestedDiagramFilename(
      {
        entities: [],
        enums: [],
        relations: [],
        indexes: [],
        constraints: [],
        meta: { source: "/app/database/migrations" },
      },
      ".png"
    ),
    "migrations.png"
  )
  assert.equal(suggestedDiagramFilename(null, ".svg"), "schema.svg")
})

test("finishExportCapture clears exportCapturing flag", () => {
  useDiagramStore.getState().setExportCapturing(true)
  assert.equal(useDiagramStore.getState().exportCapturing, true)
  finishExportCapture()
  assert.equal(useDiagramStore.getState().exportCapturing, false)
})
