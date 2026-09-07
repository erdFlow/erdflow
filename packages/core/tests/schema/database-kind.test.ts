import assert from "node:assert/strict"
import test from "node:test"
import {
  databaseKindFromProvider,
  parseDatabaseProvider,
  sqlDialectFromProvider,
} from "../../src/schema/database-kind.js"

test("parseDatabaseProvider normalizes known providers", () => {
  assert.equal(parseDatabaseProvider("postgresql"), "postgresql")
  assert.equal(parseDatabaseProvider("postgres"), "postgresql")
  assert.equal(parseDatabaseProvider("MongoDB"), "mongodb")
  assert.equal(parseDatabaseProvider("nope"), "unknown")
})

test("databaseKindFromProvider separates document vs relational", () => {
  assert.equal(databaseKindFromProvider("mongodb"), "document")
  assert.equal(databaseKindFromProvider("postgresql"), "relational")
  assert.equal(databaseKindFromProvider("unknown"), "relational")
})

test("sqlDialectFromProvider maps SQL families only", () => {
  assert.equal(sqlDialectFromProvider("postgresql"), "postgresql")
  assert.equal(sqlDialectFromProvider("cockroachdb"), "postgresql")
  assert.equal(sqlDialectFromProvider("mysql"), "mysql")
  assert.equal(sqlDialectFromProvider("sqlite"), "sqlite")
  assert.equal(sqlDialectFromProvider("mongodb"), undefined)
  assert.equal(sqlDialectFromProvider("sqlserver"), undefined)
})
