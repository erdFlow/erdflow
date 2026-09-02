import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Badge } from "@workspace/ui/components/badge";
import type { TableNodeData } from "../../types/flow-types.js";
import { DiagramNodeShell } from "./DiagramNodeShell.js";

const rowBadgeClass = "h-4 px-1 py-0 text-[10px] leading-none";

function TableNodeComponent({ data }: NodeProps) {
  const nodeData = data as TableNodeData;
  const entity = nodeData.entity;

  return (
    <DiagramNodeShell title={entity.name}>
      {!nodeData.collapsed ? (
        <div className="flex flex-col">
          {entity.fields.map((field) => (
            <div
              key={field.id}
              className="box-border flex h-6 shrink-0 items-center gap-2 border-b border-border/50 px-2 text-xs leading-none last:border-b-0"
            >
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  field.isPrimaryKey ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              />
              <span className="min-w-0 flex-1 truncate">{field.name}</span>
              <span
                className="w-20 shrink-0 truncate text-right text-muted-foreground"
                title={field.type.name}
              >
                {field.type.name}
              </span>
              <span className="flex w-8 shrink-0 justify-end">
                {field.isPrimaryKey ? (
                  <Badge className={rowBadgeClass}>PK</Badge>
                ) : field.isUnique ? (
                  <Badge variant="outline" className={rowBadgeClass}>
                    UQ
                  </Badge>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </DiagramNodeShell>
  );
}

export const TableNode = memo(TableNodeComponent);
