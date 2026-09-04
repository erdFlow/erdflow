import { useEffect } from "react"
import {
  connectSchemaSocket,
  fetchInitialSchema,
} from "../lib/schema-socket.js"
import { useDiagramStore } from "../store/diagram-store.js"

export function useSchemaSocket(): void {
  const applySchema = useDiagramStore((state) => state.applySchema)
  const setError = useDiagramStore((state) => state.setError)
  const setConnectionStatus = useDiagramStore(
    (state) => state.setConnectionStatus
  )

  useEffect(() => {
    void fetchInitialSchema(applySchema)
    return connectSchemaSocket({
      onSchema: applySchema,
      onError: setError,
      onStatus: setConnectionStatus,
    })
  }, [applySchema, setConnectionStatus, setError])
}
