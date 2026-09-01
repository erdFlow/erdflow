import { Badge } from "@workspace/ui/components/badge";
import { useDiagramStore } from "../../store/diagram-store.js";

const statusLabels = {
  connecting: "Connecting",
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Error",
} as const;

export function Footer() {
  const connectionStatus = useDiagramStore((state) => state.connectionStatus);
  const schema = useDiagramStore((state) => state.schema);

  const sourceLabel = schema?.meta?.source ?? schema?.meta?.adapter ?? "Unknown source";

  return (
    <footer className="flex items-center justify-between gap-4 border-t px-4 py-2">
      <span className="truncate text-sm text-muted-foreground">{sourceLabel}</span>
      <Badge variant={connectionStatus === "error" ? "destructive" : "secondary"}>
        {statusLabels[connectionStatus]}
      </Badge>
    </footer>
  );
}
