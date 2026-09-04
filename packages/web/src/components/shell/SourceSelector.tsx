import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import {
  SCHEMA_SOURCE_ARIA_LABEL,
  SCHEMA_VERSION_ARIA_LABEL,
  UNKNOWN_SOURCE_LABEL,
} from "../../data/labels.js"
import { formatAdapterLabel } from "../../lib/format-adapter.js"
import { useDiagramStore } from "../../store/diagram-store.js"

export function SourceSelector() {
  const schema = useDiagramStore((state) => state.schema)
  const selectedSchemaVersion = useDiagramStore(
    (state) => state.selectedSchemaVersion
  )
  const setSelectedSchemaVersion = useDiagramStore(
    (state) => state.setSelectedSchemaVersion
  )

  const adapterLabel = formatAdapterLabel(schema?.meta?.adapter)
  const versions = schema?.meta?.versions ?? []
  const hasVersionMenu = versions.length > 1
  const activeVersion =
    selectedSchemaVersion ?? schema?.meta?.version ?? versions[0] ?? null

  if (!schema?.meta?.adapter && !schema?.meta?.source) {
    return (
      <Badge variant="outline" aria-label={SCHEMA_SOURCE_ARIA_LABEL}>
        {UNKNOWN_SOURCE_LABEL}
      </Badge>
    )
  }

  if (!hasVersionMenu) {
    return (
      <Badge
        variant="secondary"
        aria-label={SCHEMA_SOURCE_ARIA_LABEL}
        className="max-w-40 truncate font-medium"
        title={adapterLabel}
      >
        {adapterLabel}
        {activeVersion ? (
          <span className="text-muted-foreground">· {activeVersion}</span>
        ) : null}
      </Badge>
    )
  }

  return (
    <DropdownMenuTrigger>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 px-2 font-medium text-xs"
        aria-label={SCHEMA_VERSION_ARIA_LABEL}
      >
        <span className="max-w-28 truncate">{adapterLabel}</span>
        {activeVersion ? (
          <span className="text-muted-foreground">{activeVersion}</span>
        ) : null}
        <ChevronDownIcon className="size-3.5 opacity-60" />
      </Button>
      <DropdownMenu placement="bottom end" className="min-w-40">
        {versions.map((version) => {
          const selected = version === activeVersion
          return (
            <DropdownMenuItem
              key={version}
              textValue={version}
              onAction={() => setSelectedSchemaVersion(version)}
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                {selected ? <CheckIcon /> : null}
              </span>
              {version}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
