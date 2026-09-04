import { type NodeProps, NodeToolbar, Position } from "@xyflow/react"
import { KeyRoundIcon, Link2Icon } from "lucide-react"
import { memo, useMemo, useState } from "react"
import type { TableNodeData } from "../../types/flow-types.js"
import { DiagramNodeShell } from "./DiagramNodeShell.js"

/** Colour a type token by broad category, roughly matching common ERD tools. */
function typeColorClass(typeName: string): string {
  const n = typeName.toLowerCase()
  if (/(date|time|timestamp|year)/.test(n)) {
    return "text-cyan-600 dark:text-cyan-400"
  }
  if (/(bool)/.test(n)) return "text-green-600 dark:text-green-400"
  if (/(enum|set)/.test(n)) return "text-violet-600 dark:text-violet-400"
  if (
    /(int|float|double|decimal|numeric|real|serial|number|money|bit)/.test(n)
  ) {
    return "text-amber-600 dark:text-amber-500"
  }
  if (/(char|text|string|uuid|json|blob|binary|clob)/.test(n)) {
    return "text-orange-600 dark:text-orange-400"
  }
  return "text-muted-foreground"
}

function isAutoIncrement(defaultValue: string | undefined): boolean {
  return /auto_?increment|nextval|identity|autoincrement/i.test(
    defaultValue ?? ""
  )
}

const pillClass = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
} as const

function AttrPill({
  label,
  tone,
}: {
  label: string
  tone: keyof typeof pillClass
}) {
  return (
    <span
      className={`rounded-md px-2 py-1 font-medium text-[11px] ${pillClass[tone]}`}
    >
      {label}
    </span>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[13px]">
      <span className="font-semibold">{label}:</span> {value}
    </p>
  )
}

function TableNodeComponent({ data }: NodeProps) {
  const nodeData = data as TableNodeData
  const entity = nodeData.entity
  const fkRefs = useMemo(() => nodeData.fkRefs ?? {}, [nodeData.fkRefs])
  const [hovered, setHovered] = useState<number | null>(null)
  const hoveredField = hovered != null ? entity.fields[hovered] : undefined

  return (
    <DiagramNodeShell title={entity.name}>
      {!nodeData.collapsed ? (
        <div className="flex flex-col" onMouseLeave={() => setHovered(null)}>
          {entity.fields.map((field, index) => {
            const isFk = field.id in fkRefs
            return (
              <div
                key={field.id}
                className="box-border flex h-6 shrink-0 items-center gap-2 border-border/50 border-b px-2 text-xs leading-none last:border-b-0 hover:bg-muted/60"
                onMouseEnter={() => setHovered(index)}
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${
                    field.isPrimaryKey ? "bg-primary" : "bg-muted-foreground/40"
                  }`}
                />
                <span className="min-w-0 flex-1 truncate">{field.name}</span>
                <span className="flex w-6 shrink-0 items-center justify-end">
                  {field.isPrimaryKey ? (
                    <KeyRoundIcon className="size-3 text-amber-500" />
                  ) : isFk ? (
                    <Link2Icon className="size-3 text-muted-foreground" />
                  ) : null}
                </span>
                <span
                  className={`flex w-[76px] shrink-0 items-center justify-end gap-0.5 truncate text-right font-mono text-[11px] ${typeColorClass(
                    field.type.name
                  )}`}
                  title={field.type.name}
                >
                  {field.nullable ? (
                    <span className="text-muted-foreground">?</span>
                  ) : null}
                  <span className="truncate">{field.type.name}</span>
                </span>
              </div>
            )
          })}
        </div>
      ) : null}

      <NodeToolbar
        isVisible={hoveredField != null && !nodeData.collapsed}
        position={Position.Right}
        offset={12}
      >
        {hoveredField ? (
          <div className="w-72 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-semibold text-lg">
                {hoveredField.name}
              </span>
              <span
                className={`font-mono text-sm ${typeColorClass(hoveredField.type.name)}`}
              >
                {hoveredField.type.name}
              </span>
            </div>

            <div className="my-3 border-border border-t" />

            {(() => {
              const pills: Array<{
                label: string
                tone: keyof typeof pillClass
              }> = []
              if (hoveredField.isPrimaryKey)
                pills.push({ label: "Primary key", tone: "blue" })
              if (hoveredField.id in fkRefs)
                pills.push({ label: "Foreign key", tone: "blue" })
              if (hoveredField.isUnique)
                pills.push({ label: "Unique", tone: "amber" })
              if (!hoveredField.nullable)
                pills.push({ label: "Not null", tone: "violet" })
              if (isAutoIncrement(hoveredField.default))
                pills.push({ label: "Autoincrement", tone: "green" })

              return pills.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {pills.map((pill) => (
                    <AttrPill
                      key={pill.label}
                      label={pill.label}
                      tone={pill.tone}
                    />
                  ))}
                </div>
              ) : null
            })()}

            <div className="space-y-1.5">
              {hoveredField.id in fkRefs ? (
                <DetailLine
                  label="References"
                  value={fkRefs[hoveredField.id] || "—"}
                />
              ) : null}
              <DetailLine
                label="Default"
                value={hoveredField.default ?? "Not set"}
              />
              <DetailLine
                label="Comment"
                value={hoveredField.comment ?? "Not set"}
              />
            </div>
          </div>
        ) : null}
      </NodeToolbar>
    </DiagramNodeShell>
  )
}

export const TableNode = memo(TableNodeComponent)
