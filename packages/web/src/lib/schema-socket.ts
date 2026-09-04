import type { UniversalSchema } from "@erdflow/core"
import type { ConnectionStatus } from "../types/diagram-store.js"

export type SchemaSocketMessage =
  | { type: "schema"; schema: UniversalSchema }
  | { type: "error"; message: string }

export interface SchemaSocketHandlers {
  onSchema: (schema: UniversalSchema) => void | Promise<void>
  onError: (message: string | null) => void
  onStatus: (status: ConnectionStatus) => void
}

export async function fetchInitialSchema(
  onSchema: SchemaSocketHandlers["onSchema"]
): Promise<void> {
  const response = await fetch("/api/schema")
  if (!response.ok) {
    return
  }

  const schema = (await response.json()) as UniversalSchema
  await onSchema(schema)
}

/** Open a reconnecting WebSocket to `/ws`. Returns a dispose function. */
export function connectSchemaSocket(
  handlers: SchemaSocketHandlers
): () => void {
  let socket: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  function connect() {
    if (disposed) {
      return
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws"
    socket = new WebSocket(`${protocol}://${window.location.host}/ws`)

    socket.addEventListener("open", () => {
      handlers.onStatus("connected")
    })

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data as string) as SchemaSocketMessage

        if (message.type === "schema") {
          void handlers.onSchema(message.schema)
          handlers.onError(null)
          return
        }

        if (message.type === "error") {
          handlers.onError(message.message ?? "Unknown schema error")
          handlers.onStatus("error")
        }
      } catch (error) {
        handlers.onError(error instanceof Error ? error.message : String(error))
        handlers.onStatus("error")
      }
    })

    socket.addEventListener("close", () => {
      if (disposed) {
        return
      }
      handlers.onStatus("disconnected")
      reconnectTimer = setTimeout(connect, 1000)
    })

    socket.addEventListener("error", () => {
      handlers.onStatus("error")
    })
  }

  handlers.onStatus("connecting")
  connect()

  return () => {
    disposed = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
    }
    socket?.close()
  }
}
