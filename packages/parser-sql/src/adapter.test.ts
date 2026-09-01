import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import { createEntityId, validateSchema } from "@erdflow/core";
import { sqlAdapter } from "./adapter.js";
import { inferSqlDialect } from "./infer-dialect.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

test("inferSqlDialect detects postgres, mysql, and sqlite", () => {
  assert.equal(
    inferSqlDialect(readFileSync(join(fixtureDir, "postgres.sql"), "utf8")),
    "postgresql",
  );
  assert.equal(
    inferSqlDialect(readFileSync(join(fixtureDir, "mysql.sql"), "utf8")),
    "mysql",
  );
  assert.equal(
    inferSqlDialect(readFileSync(join(fixtureDir, "sqlite.sql"), "utf8")),
    "sqlite",
  );
});

test("sqlAdapter parses PostgreSQL fixture", async () => {
  const input = readFileSync(join(fixtureDir, "postgres.sql"), "utf8");
  const schema = await sqlAdapter.parse(input, {
    filePath: "postgres.sql",
    dialect: "postgresql",
  });

  assert.equal(schema.entities.length, 2);
  assert.equal(schema.relations.length, 1);
  assert.ok(schema.indexes.length >= 1);
  assert.equal(schema.entities.find((e) => e.name === "users")?.id, createEntityId("users"));
  assert.equal(validateSchema(schema).valid, true);
});

test("sqlAdapter parses MySQL fixture", async () => {
  const input = readFileSync(join(fixtureDir, "mysql.sql"), "utf8");
  const schema = await sqlAdapter.parse(input, {
    filePath: "mysql.sql",
    dialect: "mysql",
  });

  assert.equal(schema.entities.length, 2);
  assert.equal(schema.relations.length, 1);
  assert.equal(validateSchema(schema).valid, true);
});

test("sqlAdapter parses SQLite fixture", async () => {
  const input = readFileSync(join(fixtureDir, "sqlite.sql"), "utf8");
  const schema = await sqlAdapter.parse(input, {
    filePath: "sqlite.sql",
    dialect: "sqlite",
  });

  assert.equal(schema.entities.length, 2);
  assert.equal(schema.relations.length, 1);
  assert.equal(schema.indexes.length, 1);
  assert.equal(validateSchema(schema).valid, true);
});
