import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"
import type { NodeProps } from "@xyflow/react"
import { InfoIcon } from "lucide-react"
import { memo, useMemo } from "react"
import { ENUM_USAGE_ARIA_LABEL, enumUsedByLabel } from "../../data/labels.js"
import { formatEnumUsage } from "../../lib/enum-usages.js"
import type { EnumNodeData } from "../../types/flow-types.js"
import { DiagramNodeShell } from "./DiagramNodeShell.js"

function EnumNodeComponent({ data }: NodeProps) {
  const nodeData = data as EnumNodeData
  const enumDef = nodeData.enumDef
  const usages = nodeData.usages ?? []
  const compact = Boolean(nodeData.compact)

  const usageLabel = useMemo(
    () => enumUsedByLabel(usages.map(formatEnumUsage)),
    [usages]
  )

  return (
    <DiagramNodeShell
      title={enumDef.name}
      headerTrailing={
        compact ? null : (
          <TooltipTrigger delay={200}>
            <button
              type="button"
              className="nodrag nopan flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-background/60 hover:text-foreground"
              aria-label={ENUM_USAGE_ARIA_LABEL}
            >
              <InfoIcon className="size-3.5" />
            </button>
            <Tooltip placement="top">{usageLabel}</Tooltip>
          </TooltipTrigger>
        )
      }
    >
      {compact ? null : (
        <div className="flex flex-col">
          {enumDef.values.map((value) => (
            <div
              key={value}
              className="box-border flex h-5 shrink-0 items-center border-border/50 border-b px-3 text-xs leading-none last:border-b-0"
            >
              <span className="truncate text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      )}
    </DiagramNodeShell>
  )
}

export const EnumNode = memo(EnumNodeComponent)
