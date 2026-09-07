import assert from "node:assert/strict"
import test from "node:test"
import { applyMigrationOps } from "../src/apply-migrations.js"
import type { MigrationOp } from "../src/parse-migration.js"

test("applyMigrationOps drops tables", () => {
  const ops: MigrationOp[] = [
    {
      kind: "create",
      table: "users",
      columns: [
        {
          name: "id",
          typeName: "bigint",
          nullable: false,
          isPrimaryKey: true,
        },
      ],
      foreignKeys: [],
    },
    { kind: "drop", table: "users" },
  ]

  const tables = applyMigrationOps(ops)
  assert.equal(tables.size, 0)
})

test("applyMigrationOps alters accumulate columns", () => {
  const ops: MigrationOp[] = [
    {
      kind: "create",
      table: "orders",
      columns: [
        {
          name: "id",
          typeName: "bigint",
          nullable: false,
          isPrimaryKey: true,
        },
      ],
      foreignKeys: [],
    },
    {
      kind: "alter",
      table: "orders",
      columns: [
        {
          name: "status",
          typeName: "string",
          nullable: false,
          default: "pending",
        },
      ],
      foreignKeys: [],
    },
  ]

  const tables = applyMigrationOps(ops)
  const orders = tables.get("orders")
  assert.ok(orders)
  assert.equal(orders.columns.size, 2)
  assert.ok(orders.columns.has("status"))
})
