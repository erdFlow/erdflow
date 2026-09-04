import { Handle, Position } from "@xyflow/react"
import type { ReactNode } from "react"
import {
  NODE_SOURCE_HANDLE_ID,
  NODE_TARGET_HANDLE_ID,
} from "../../lib/relation-handles.js"

interface DiagramNodeShellProps {
  title: string
  headerTrailing?: ReactNode
  children?: ReactNode
}

const hiddenHandleClass =
  "!h-1 !w-1 !min-w-0 !border-0 !bg-transparent opacity-0"

export function DiagramNodeShell({
  title,
  headerTrailing,
  children,
}: DiagramNodeShellProps) {
  return (
    <div className="relative size-full min-w-0 overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm transition-colors hover:border-muted-foreground/70 hover:border-dashed">
      <Handle
        type="target"
        position={Position.Left}
        id={NODE_TARGET_HANDLE_ID}
        className={hiddenHandleClass}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={NODE_SOURCE_HANDLE_ID}
        className={hiddenHandleClass}
        isConnectable={false}
      />
      <div className="flex h-12 shrink-0 items-center gap-2 border-b bg-muted px-3">
        <span className="min-w-0 flex-1 truncate font-medium text-sm">
          {title}
        </span>
        {headerTrailing}
      </div>
      {children}
    </div>
  )
}
