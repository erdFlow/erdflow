import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { useMemo } from "react"
import {
  RELATIONSHIP_TABLE_EMPTY_DESCRIPTION,
  RELATIONSHIP_TABLE_EMPTY_TITLE,
  RELATIONSHIP_TABLE_TITLE,
  SHOW_RELATIONSHIP_TABLE_LABEL,
} from "../../data/labels.js"
import {
  formatEntityRelationRow,
  getEntityRelationRows,
} from "../../lib/entity-relations.js"
import { useDiagramStore } from "../../store/diagram-store.js"

export function RelationshipTablePanel() {
  const schema = useDiagramStore((state) => state.schema)
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)

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
      className="flex w-80 flex-col overflow-hidden rounded-lg border bg-background shadow-md"
      aria-label={SHOW_RELATIONSHIP_TABLE_LABEL}
    >
      <div className="shrink-0 border-b px-3 py-2">
        <p className="font-medium text-sm">{RELATIONSHIP_TABLE_TITLE}</p>
        <p className="truncate text-muted-foreground text-xs">{entity.name}</p>
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
          <ul className="space-y-1 p-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-md px-2 py-1.5 font-mono text-xs leading-snug"
              >
                {formatEntityRelationRow(row)}
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </aside>
  )
}
