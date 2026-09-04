import { Badge } from "@workspace/ui/components/badge"
import {
  CONNECTION_STATUS_LABELS,
  UNKNOWN_SOURCE_LABEL,
} from "../../data/labels.js"
import { useDiagramStore } from "../../store/diagram-store.js"

export function Footer() {
  const connectionStatus = useDiagramStore((state) => state.connectionStatus)
  const schema = useDiagramStore((state) => state.schema)
  const zoom = useDiagramStore((state) => state.zoom)

  const sourceLabel = schema?.meta?.source ?? UNKNOWN_SOURCE_LABEL
  const zoomPercent = `${Math.round(zoom * 100)}%`

  return (
    <footer className="flex items-center justify-between gap-4 border-t px-4 py-2">
      <span className="truncate text-muted-foreground text-sm">
        {sourceLabel}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className="tabular-nums text-muted-foreground text-sm"
          aria-label={`Zoom ${zoomPercent}`}
        >
          {zoomPercent}
        </span>
        <Badge
          variant={connectionStatus === "error" ? "destructive" : "secondary"}
        >
          {CONNECTION_STATUS_LABELS[connectionStatus]}
        </Badge>
      </div>
    </footer>
  )
}
