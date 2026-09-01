import { useEffect } from "react";
import { useDiagramStore } from "../store/diagram-store.js";

async function fetchInitialSchema(): Promise<void> {
  const response = await fetch("/api/schema");
  if (!response.ok) {
    return;
  }

  const schema = await response.json();
  await useDiagramStore.getState().applySchema(schema);
}

export function useSchemaSocket(): void {
  const applySchema = useDiagramStore((state) => state.applySchema);
  const setError = useDiagramStore((state) => state.setError);
  const setConnectionStatus = useDiagramStore((state) => state.setConnectionStatus);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    void fetchInitialSchema();

    function connect() {
      if (disposed) {
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

      socket.addEventListener("open", () => {
        setConnectionStatus("connected");
      });

      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data as string) as
            | { type: "schema"; schema: Parameters<typeof applySchema>[0] }
            | { type: "error"; message: string };

          if (message.type === "schema") {
            void applySchema(message.schema);
            setError(null);
            return;
          }

          if (message.type === "error") {
            setError(message.message ?? "Unknown schema error");
            setConnectionStatus("error");
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : String(error));
          setConnectionStatus("error");
        }
      });

      socket.addEventListener("close", () => {
        if (disposed) {
          return;
        }
        setConnectionStatus("disconnected");
        reconnectTimer = setTimeout(connect, 1000);
      });

      socket.addEventListener("error", () => {
        setConnectionStatus("error");
      });
    }

    setConnectionStatus("connecting");
    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, [applySchema, setConnectionStatus, setError]);
}
