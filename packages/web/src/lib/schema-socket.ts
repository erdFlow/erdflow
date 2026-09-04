import type { UniversalSchema } from "@erdflow/core"
import {
  SCHEMA_API_PATH,
  SCHEMA_RECONNECT_MS,
  SCHEMA_WS_PATH,
  UNKNOWN_SCHEMA_ERROR,
} from "../data/constants.js"
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
  const response = await fetch(SCHEMA_API_PATH)
  if (!response.ok) {
    return
  }

  const schema = (await response.json()) as UniversalSchema
  await onSchema(schema)
}

/** Open a reconnecting WebSocket to the schema socket path. Returns dispose. */
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
    socket = new WebSocket(
      `${protocol}://${window.location.host}${SCHEMA_WS_PATH}`
    )

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
          handlers.onError(message.message ?? UNKNOWN_SCHEMA_ERROR)
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
      reconnectTimer = setTimeout(connect, SCHEMA_RECONNECT_MS)
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
