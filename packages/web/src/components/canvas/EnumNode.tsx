import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Separator } from "@workspace/ui/components/separator";
import type { EnumNodeData } from "../../types/flow-types.js";

function EnumNodeComponent({ data }: NodeProps) {
  const nodeData = data as EnumNodeData;
  const enumDef = nodeData.enumDef;

  return (
    <Card size="sm" className="size-full min-w-0">
      <CardHeader className="border-b">
        <CardTitle>{enumDef.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-48">
          <div className="flex flex-col">
            {enumDef.values.map((value, index) => (
              <div key={value}>
                {index > 0 ? <Separator /> : null}
                <div className="flex items-center px-4 py-2">
                  <Badge variant="secondary">{value}</Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export const EnumNode = memo(EnumNodeComponent);
