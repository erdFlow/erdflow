import { type NodeProps, NodeToolbar, Position } from "@xyflow/react"
import { KeyRoundIcon, Link2Icon } from "lucide-react"
import { memo, useMemo, useState } from "react"
import { typeColorClass } from "../../lib/type-color.js"
import type { TableNodeData } from "../../types/flow-types.js"
import { DiagramNodeShell } from "./DiagramNodeShell.js"

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
      className={`rounded px-1.5 py-0.5 font-medium text-[10px] leading-none ${pillClass[tone]}`}
    >
      {label}
    </span>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="truncate text-[11px] leading-snug text-muted-foreground">
      <span className="font-medium text-foreground">{label}:</span> {value}
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
        offset={8}
      >
        {hoveredField ? (
          <div className="w-52 rounded-lg border border-border bg-card px-2.5 py-2 text-card-foreground shadow-md">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-semibold text-sm leading-tight">
                {hoveredField.name}
              </span>
              <span
                className={`shrink-0 font-mono text-[11px] ${typeColorClass(hoveredField.type.name)}`}
              >
                {hoveredField.type.name}
              </span>
            </div>

            <div className="my-1.5 border-border border-t" />

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
                <div className="mb-1.5 flex flex-wrap gap-1">
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

            <div className="space-y-0.5">
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
