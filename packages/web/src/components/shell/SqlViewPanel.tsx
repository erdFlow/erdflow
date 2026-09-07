import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { CheckIcon, CopyIcon, XIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { SQL_VIEW_COPIED_LABEL } from "../../data/labels.js"
import { entityToDocument } from "../../lib/entity-to-document.js"
import { entityToSql } from "../../lib/entity-to-sql.js"
import { renderHighlightedSql } from "../../lib/highlight-sql.js"
import {
  schemaDatabaseKind,
  schemaViewLabels,
} from "../../lib/schema-view-labels.js"
import { useDiagramStore } from "../../store/diagram-store.js"

export function SqlViewPanel() {
  const schema = useDiagramStore((state) => state.schema)
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)
  const setShowSqlView = useDiagramStore((state) => state.setShowSqlView)
  const [copied, setCopied] = useState(false)

  const kind = schemaDatabaseKind(schema)
  const labels = schemaViewLabels(kind)

  const entity = useMemo(() => {
    if (!schema || !focusedEntityId) {
      return null
    }
    return schema.entities.find((entry) => entry.id === focusedEntityId) ?? null
  }, [focusedEntityId, schema])

  const content = useMemo(() => {
    if (!schema || !focusedEntityId) {
      return null
    }
    if (kind === "document") {
      return entityToDocument(schema, focusedEntityId)
    }
    return entityToSql(schema, focusedEntityId)
  }, [focusedEntityId, kind, schema])

  const highlighted = useMemo(
    () =>
      content && kind === "relational" ? renderHighlightedSql(content) : null,
    [content, kind]
  )

  async function handleCopy() {
    if (!content) {
      return
    }
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <aside
      className="flex size-full min-h-0 flex-col border-l bg-background"
      aria-label={labels.menu}
    >
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3">
        <div className="min-w-0">
          <p className="font-medium text-sm">{labels.menu}</p>
          {entity ? (
            <p className="truncate text-muted-foreground text-xs">
              {entity.name}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {content ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                void handleCopy()
              }}
              aria-label={copied ? SQL_VIEW_COPIED_LABEL : labels.copy}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowSqlView(false)}
            aria-label={labels.close}
          >
            <XIcon />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {content ? (
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed">
            <code>{highlighted ?? content}</code>
          </pre>
        ) : (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyTitle>{labels.emptyTitle}</EmptyTitle>
              <EmptyDescription>{labels.emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </aside>
  )
}
