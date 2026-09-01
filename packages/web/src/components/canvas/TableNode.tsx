import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Separator } from "@workspace/ui/components/separator";
import { ChevronDownIcon } from "lucide-react";
import { useDiagramStore } from "../../store/diagram-store.js";
import type { TableNodeData } from "../../types/flow-types.js";

function TableNodeComponent({ id, data }: NodeProps) {
  const nodeData = data as TableNodeData;
  const toggleTableCollapsed = useDiagramStore((state) => state.toggleTableCollapsed);
  const entity = nodeData.entity;
  const collapsed = nodeData.collapsed;

  return (
    <Card size="sm" className="size-full min-w-0">
      <Collapsible isExpanded={!collapsed} onExpandedChange={() => toggleTableCollapsed(id)}>
        <CardHeader className="border-b">
          <CollapsibleTrigger className="flex w-full items-center justify-between">
            <CardTitle>{entity.name}</CardTitle>
            <ChevronDownIcon data-icon="inline-end" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-0">
            <ScrollArea className="max-h-64">
              <div className="flex flex-col">
                {entity.fields.map((field, index) => (
                  <div key={field.id}>
                    {index > 0 ? <Separator /> : null}
                    <div className="flex items-center gap-2 px-4 py-2">
                      <span className="min-w-0 flex-1 truncate">{field.name}</span>
                      <Badge variant="secondary">{field.type.name}</Badge>
                      {field.isPrimaryKey ? <Badge>PK</Badge> : null}
                      {field.isUnique && !field.isPrimaryKey ? (
                        <Badge variant="outline">UQ</Badge>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export const TableNode = memo(TableNodeComponent);
