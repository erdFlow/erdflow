import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import { createRelationId } from "@erdflow/core";
import { dbmlAdapter } from "@erdflow/parser-dbml";
import {
  clearLayoutCache,
  defaultLayoutCache,
  layoutSchema,
  schemaTopologyHash,
} from "./index.js";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../parser-dbml/fixtures",
);

async function loadBasicSchema() {
  const input = readFileSync(join(fixtureDir, "basic.dbml"), "utf8");
  return dbmlAdapter.parse(input, { filePath: "basic.dbml" });
}

test("layoutSchema produces nodes for all entities and enums", async () => {
  clearLayoutCache();
  const schema = await loadBasicSchema();
  const result = await layoutSchema(schema);

  assert.equal(result.nodes.length, schema.entities.length + schema.enums.length);

  const positions = result.nodes.map((node) => `${node.x},${node.y}`);
  assert.equal(new Set(positions).size, positions.length);

  for (const entity of schema.entities) {
    const node = result.nodes.find((candidate) => candidate.id === entity.id);
    assert.ok(node, `missing node for entity ${entity.id}`);
    assert.equal(node!.kind, "entity");
    assert.ok(node!.width > 0);
    assert.ok(node!.height > 0);
  }

  for (const enumDef of schema.enums) {
    const node = result.nodes.find((candidate) => candidate.id === enumDef.id);
    assert.ok(node, `missing node for enum ${enumDef.id}`);
    assert.equal(node!.kind, "enum");
  }
});

test("layoutSchema produces edges for relations", async () => {
  clearLayoutCache();
  const schema = await loadBasicSchema();
  const result = await layoutSchema(schema);

  assert.equal(result.edges.length, schema.relations.length);

  for (const relation of schema.relations) {
    const edge = result.edges.find((candidate) => candidate.id === relation.id);
    assert.ok(edge, `missing edge for relation ${relation.id}`);
    assert.equal(edge!.sourceId, relation.from.entityId);
    assert.equal(edge!.targetId, relation.to.entityId);
  }
});

test("layoutSchema returns cached result on second call", async () => {
  clearLayoutCache();
  const schema = await loadBasicSchema();

  const first = await layoutSchema(schema);
  const second = await layoutSchema(schema);

  assert.equal(first, second);
  assert.equal(defaultLayoutCache.size, 1);
});

test("layoutSchema recomputes when topology changes", async () => {
  clearLayoutCache();
  const schema = await loadBasicSchema();
  const firstHash = schemaTopologyHash(schema);

  const first = await layoutSchema(schema);

  const modifiedSchema = {
    ...schema,
    relations: [
      ...schema.relations,
      {
        id: createRelationId("orders", "products"),
        from: { entityId: schema.entities[1]!.id },
        to: { entityId: schema.entities[0]!.id },
        cardinality: "one-to-many" as const,
      },
    ],
  };

  const secondHash = schemaTopologyHash(modifiedSchema);
  assert.notEqual(firstHash, secondHash);

  const second = await layoutSchema(modifiedSchema);
  assert.notEqual(first, second);
  assert.equal(defaultLayoutCache.size, 2);
});

test("schemaTopologyHash is stable for identical schema", async () => {
  const schema = await loadBasicSchema();
  assert.equal(schemaTopologyHash(schema), schemaTopologyHash(schema));
});
