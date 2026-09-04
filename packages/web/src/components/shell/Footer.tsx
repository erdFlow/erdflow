import { Badge } from "@workspace/ui/components/badge"
import {
  CONNECTION_STATUS_LABELS,
  UNKNOWN_SOURCE_LABEL,
} from "../../data/labels.js"
import { useDiagramStore } from "../../store/diagram-store.js"

export function Footer() {
  const connectionStatus = useDiagramStore((state) => state.connectionStatus)
  const schema = useDiagramStore((state) => state.schema)

  const sourceLabel =
    schema?.meta?.source ?? schema?.meta?.adapter ?? UNKNOWN_SOURCE_LABEL

  return (
    <footer className="flex items-center justify-between gap-4 border-t px-4 py-2">
      <span className="truncate text-muted-foreground text-sm">
        {sourceLabel}
      </span>
      <Badge
        variant={connectionStatus === "error" ? "destructive" : "secondary"}
      >
        {CONNECTION_STATUS_LABELS[connectionStatus]}
      </Badge>
    </footer>
  )
}
