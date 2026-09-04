import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { ArrowRightIcon, XIcon } from "lucide-react"
import { useMemo } from "react"
import {
  RELATIONSHIP_TABLE_CLOSE_LABEL,
  RELATIONSHIP_TABLE_EMPTY_DESCRIPTION,
  RELATIONSHIP_TABLE_EMPTY_TITLE,
  RELATIONSHIP_TABLE_TITLE,
  SHOW_RELATIONSHIP_TABLE_LABEL,
} from "../../data/labels.js"
import {
  type EntityRelationRow,
  formatEntityRelationRow,
  getEntityRelationRows,
} from "../../lib/entity-relations.js"
import { useDiagramStore } from "../../store/diagram-store.js"

function CardinalityBadge({ value }: { value: string }) {
  const isMany = value === "N"
  return (
    <span
      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full font-semibold text-[10px] ${
        isMany
          ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
          : "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
      }`}
    >
      {value}
    </span>
  )
}

function EntityChip({
  name,
  highlighted,
}: {
  name: string
  highlighted: boolean
}) {
  return (
    <span
      className={`max-w-24 truncate rounded-md px-1.5 py-0.5 font-medium text-xs ${
        highlighted
          ? "bg-foreground/10 text-foreground"
          : "bg-muted text-muted-foreground"
      }`}
      title={name}
    >
      {name}
    </span>
  )
}

function RelationMappingRow({
  row,
  focusedName,
}: {
  row: EntityRelationRow
  focusedName: string
}) {
  return (
    <li
      className="rounded-md border border-border/60 bg-card px-2 py-2 hover:bg-muted/50"
      aria-label={formatEntityRelationRow(row)}
    >
      <div className="flex items-center gap-1.5">
        <EntityChip
          name={row.fromName}
          highlighted={row.fromName === focusedName}
        />
        <CardinalityBadge value={row.fromCard} />
        <span className="flex min-w-6 flex-1 items-center gap-0.5 text-blue-500 dark:text-blue-400">
          <span className="h-px flex-1 bg-current/40" />
          <ArrowRightIcon className="size-3.5 shrink-0" />
        </span>
        <CardinalityBadge value={row.toCard} />
        <EntityChip
          name={row.toName}
          highlighted={row.toName === focusedName}
        />
      </div>
    </li>
  )
}

export function RelationshipTablePanel() {
  const schema = useDiagramStore((state) => state.schema)
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)
  const setShowRelationshipTable = useDiagramStore(
    (state) => state.setShowRelationshipTable
  )

  const entity = useMemo(() => {
    if (!schema || !focusedEntityId) {
      return null
    }
    return schema.entities.find((entry) => entry.id === focusedEntityId) ?? null
  }, [focusedEntityId, schema])

  const rows = useMemo(() => {
    if (!schema || !focusedEntityId) {
      return []
    }
    return getEntityRelationRows(schema, focusedEntityId)
  }, [focusedEntityId, schema])

  if (!entity) {
    return null
  }

  return (
    <aside
      className="flex w-80 flex-col overflow-hidden rounded-lg border bg-background/95 shadow-md backdrop-blur-sm"
      aria-label={SHOW_RELATIONSHIP_TABLE_LABEL}
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b bg-muted/40 px-3 py-2">
        <div className="min-w-0">
          <p className="font-medium text-sm">{RELATIONSHIP_TABLE_TITLE}</p>
          <p className="truncate text-muted-foreground text-xs">{entity.name}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={() => setShowRelationshipTable(false)}
          aria-label={RELATIONSHIP_TABLE_CLOSE_LABEL}
        >
          <XIcon />
        </Button>
      </div>

      {rows.length === 0 ? (
        <Empty className="border-0 p-6">
          <EmptyHeader>
            <EmptyTitle>{RELATIONSHIP_TABLE_EMPTY_TITLE}</EmptyTitle>
            <EmptyDescription>
              {RELATIONSHIP_TABLE_EMPTY_DESCRIPTION}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ScrollArea className="max-h-72">
          <ul className="space-y-1.5 p-2">
            {rows.map((row) => (
              <RelationMappingRow
                key={row.id}
                row={row}
                focusedName={entity.name}
              />
            ))}
          </ul>
        </ScrollArea>
      )}
    </aside>
  )
}
