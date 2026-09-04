import type { NodeProps } from "@xyflow/react"
import { memo } from "react"
import type { EnumNodeData } from "../../types/flow-types.js"
import { DiagramNodeShell } from "./DiagramNodeShell.js"

function EnumNodeComponent({ data }: NodeProps) {
  const nodeData = data as EnumNodeData
  const enumDef = nodeData.enumDef

  return (
    <DiagramNodeShell title={enumDef.name}>
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
    </DiagramNodeShell>
  )
}

export const EnumNode = memo(EnumNodeComponent)
