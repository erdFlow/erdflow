import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { CheckIcon, CopyIcon } from "lucide-react"
import { useMemo, useState } from "react"
import {
  SHOW_SQL_VIEW_LABEL,
  SQL_VIEW_COPIED_LABEL,
  SQL_VIEW_COPY_LABEL,
  SQL_VIEW_EMPTY_DESCRIPTION,
  SQL_VIEW_EMPTY_LABEL,
} from "../../data/labels.js"
import { entityToSql } from "../../lib/entity-to-sql.js"
import { renderHighlightedSql } from "../../lib/highlight-sql.js"
import { useDiagramStore } from "../../store/diagram-store.js"

export function SqlViewPanel() {
  const schema = useDiagramStore((state) => state.schema)
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)
  const [copied, setCopied] = useState(false)

  const entity = useMemo(() => {
    if (!schema || !focusedEntityId) {
      return null
    }
    return schema.entities.find((entry) => entry.id === focusedEntityId) ?? null
  }, [focusedEntityId, schema])

  const sql = useMemo(() => {
    if (!schema || !focusedEntityId) {
      return null
    }
    return entityToSql(schema, focusedEntityId)
  }, [focusedEntityId, schema])

  const highlighted = useMemo(
    () => (sql ? renderHighlightedSql(sql) : null),
    [sql]
  )

  async function handleCopy() {
    if (!sql) {
      return
    }
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <aside
      className="flex size-full min-h-0 flex-col border-l bg-background"
      aria-label={SHOW_SQL_VIEW_LABEL}
    >
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3">
        <div className="min-w-0">
          <p className="font-medium text-sm">{SHOW_SQL_VIEW_LABEL}</p>
          {entity ? (
            <p className="truncate text-muted-foreground text-xs">
              {entity.name}
            </p>
          ) : null}
        </div>
        {sql ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void handleCopy()
            }}
            aria-label={SQL_VIEW_COPY_LABEL}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? SQL_VIEW_COPIED_LABEL : SQL_VIEW_COPY_LABEL}
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {highlighted && sql ? (
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed">
            <code>{highlighted}</code>
          </pre>
        ) : (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>{SQL_VIEW_EMPTY_LABEL}</EmptyTitle>
              <EmptyDescription>{SQL_VIEW_EMPTY_DESCRIPTION}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </aside>
  )
}
