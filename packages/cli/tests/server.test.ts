import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { createEntityId } from "@erdflow/core";
import { createServer } from "../src/server.js";

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

test("built index.html serves React visualizer bundle, not legacy app.js", async () => {
  const indexHtml = await readFile(join(fixturePublicDir, "index.html"), "utf8");

  assert.match(indexHtml, /\/assets\/index-[^"]+\.js/);
  assert.doesNotMatch(indexHtml, /app\.js/);
  assert.match(indexHtml, /id="root"/);
});

test("createServer serves woff2 fonts with correct content-type", async () => {
  const publicDir = await mkdtemp(join(tmpdir(), "erdflow-public-"));
  const assetsDir = join(publicDir, "assets");
  await mkdir(assetsDir, { recursive: true });
  await writeFile(join(publicDir, "index.html"), "<html></html>");
  await writeFile(join(assetsDir, "font.woff2"), "fake-font");

  const server = await createServer({
    port: 0,
    publicDir,
    host: "127.0.0.1",
  });

  const response = await fetch(`${server.url}assets/font.woff2`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "font/woff2");

  await server.close();
});

test("createServer serves built woff2 assets from public directory", async () => {
  const assetsDir = join(fixturePublicDir, "assets");
  let fontFile: string | undefined;

  try {
    const files = await readdir(assetsDir);
    fontFile = files.find((file) => file.endsWith(".woff2"));
  } catch {
    fontFile = undefined;
  }

  if (!fontFile) {
    return;
  }

  const server = await createServer({
    port: 0,
    publicDir: fixturePublicDir,
    host: "127.0.0.1",
  });

  const response = await fetch(`${server.url}assets/${fontFile}`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "font/woff2");

  await server.close();
});
