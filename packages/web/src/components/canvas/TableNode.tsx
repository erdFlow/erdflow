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
              <span className="min-w-0 flex-1 truncate">{field.name}</span>
              <Badge
                variant="secondary"
                className={`max-w-24 shrink truncate ${rowBadgeClass}`}
              >
                {field.type.name}
              </Badge>
              <div className="flex shrink-0 items-center gap-1">
                {field.isPrimaryKey ? (
                  <Badge className={rowBadgeClass}>PK</Badge>
                ) : null}
                {field.isUnique && !field.isPrimaryKey ? (
                  <Badge variant="outline" className={rowBadgeClass}>
                    UQ
                  </Badge>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </DiagramNodeShell>
  );
}

export const TableNode = memo(TableNodeComponent);
