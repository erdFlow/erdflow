import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import { createEntityId, validateSchema } from "@erdflow/core";
import { dbmlAdapter } from "../src/adapter.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

test("dbmlAdapter parses fixture into UniversalSchema", async () => {
  const input = readFileSync(join(fixtureDir, "basic.dbml"), "utf8");
  const schema = await dbmlAdapter.parse(input, {
    filePath: "basic.dbml",
  });

  assert.equal(schema.entities.length, 2);
  assert.equal(schema.enums.length, 1);
  assert.equal(schema.relations.length, 1);
  assert.equal(schema.indexes.length, 1);
  assert.equal(schema.meta?.adapter, "dbml");

  const users = schema.entities.find((entity) => entity.name === "users");
  assert.ok(users);
  assert.equal(users.id, createEntityId("users"));
  assert.equal(users.fields.length, 3);

  const validation = validateSchema(schema);
  assert.equal(validation.valid, true);
});
