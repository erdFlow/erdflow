import { mkdtemp, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { createEntityId } from "@erdflow/core";
import { createServer } from "./server.js";

const fixturePublicDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public",
);

test("createServer serves /api/schema and accepts websocket clients", async () => {
  const server = await createServer({
    port: 0,
    publicDir: fixturePublicDir,
    host: "127.0.0.1",
  });
  const schema = {
    entities: [
      {
        id: createEntityId("users"),
        name: "users",
        kind: "table" as const,
        fields: [],
      },
    ],
    enums: [],
    relations: [],
    indexes: [],
    constraints: [],
  };

  server.broadcastSchema(schema);

  const response = await fetch(`${server.url}api/schema`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as { entities: unknown[] };
  assert.equal(body.entities.length, 1);

  const indexResponse = await fetch(server.url);
  assert.equal(indexResponse.status, 200);
  assert.match(await indexResponse.text(), /erdflow/i);

  const wsUrl = new URL("/ws", server.url);
  wsUrl.protocol = "ws:";

  const message = await new Promise<string>((resolvePromise, rejectPromise) => {
    const ws = new WebSocket(wsUrl.toString());
    ws.on("message", (data) => {
      resolvePromise(String(data));
      ws.close();
    });
    ws.on("error", rejectPromise);
  });

  const parsed = JSON.parse(message) as { type: string; schema?: { entities: unknown[] } };
  assert.equal(parsed.type, "schema");
  assert.equal(parsed.schema?.entities.length, 1);

  await server.close();
});
