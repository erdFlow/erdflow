import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import { createEntityId, validateSchema } from "@erdflow/core";
import { prismaAdapter } from "./adapter.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

test("prismaAdapter parses fixture into UniversalSchema", async () => {
  const input = readFileSync(join(fixtureDir, "basic.prisma"), "utf8");
  const schema = await prismaAdapter.parse(input, {
    filePath: "basic.prisma",
  });

  assert.equal(schema.entities.length, 5);
  assert.equal(schema.enums.length, 1);
  assert.ok(schema.relations.length >= 4);
  assert.ok(schema.indexes.length >= 2);
  assert.equal(schema.meta?.adapter, "prisma");

  const user = schema.entities.find((entity) => entity.name === "User");
  assert.ok(user);
  assert.equal(user.id, createEntityId("User"));
  assert.ok(user.fields.some((field) => field.name === "tags" && field.type.isArray));

  const validation = validateSchema(schema);
  assert.equal(validation.valid, true);
});
