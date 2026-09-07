import assert from "node:assert/strict"
import { createServer as createNetServer } from "node:net"
import { dirname, join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import WebSocket from "ws"
import { createServer } from "../src/server.js"

const fixturePublicDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public"
)

test("createServer rejects when port is already in use", async () => {
  const blocker = createNetServer()
  await new Promise<void>((resolvePromise, rejectPromise) => {
    blocker.once("error", rejectPromise)
    blocker.listen(0, "127.0.0.1", () => resolvePromise())
  })

  const address = blocker.address()
  assert.ok(address && typeof address === "object")
  const port = address.port

  await assert.rejects(
    () =>
      createServer({
        port,
        publicDir: fixturePublicDir,
        host: "127.0.0.1",
      }),
    (error: unknown) => {
      assert.ok(error && typeof error === "object" && "code" in error)
      assert.equal((error as NodeJS.ErrnoException).code, "EADDRINUSE")
      return true
    }
  )

  await new Promise<void>((resolvePromise, rejectPromise) => {
    blocker.close((err) => (err ? rejectPromise(err) : resolvePromise()))
  })
})

test("broadcastError delivers error message over websocket", async () => {
  const server = await createServer({
    port: 0,
    publicDir: fixturePublicDir,
    host: "127.0.0.1",
  })

  const wsUrl = new URL("/ws", server.url)
  wsUrl.protocol = "ws:"

  const message = await new Promise<string>((resolvePromise, rejectPromise) => {
    const ws = new WebSocket(wsUrl.toString())
    ws.on("open", () => {
      server.broadcastError("parse failed: invalid schema")
    })
    ws.on("message", (data) => {
      resolvePromise(String(data))
      ws.close()
    })
    ws.on("error", rejectPromise)
  })

  const parsed = JSON.parse(message) as { type: string; message?: string }
  assert.equal(parsed.type, "error")
  assert.equal(parsed.message, "parse failed: invalid schema")

  await server.close()
})
