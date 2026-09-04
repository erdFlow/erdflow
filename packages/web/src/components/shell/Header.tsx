import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { Switch } from "@workspace/ui/components/switch"
import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { FocusIcon, Maximize2Icon, MinusIcon, PlusIcon } from "lucide-react"
import { useDiagramStore } from "../../store/diagram-store.js"

export function Header() {
  const schema = useDiagramStore((state) => state.schema)
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)
  const showRelations = useDiagramStore((state) => state.showRelations)
  const canvasControls = useDiagramStore((state) => state.canvasControls)
  const clearFocus = useDiagramStore((state) => state.clearFocus)
  const setShowRelations = useDiagramStore((state) => state.setShowRelations)

  const entityCount = schema?.entities.length ?? 0
  const enumCount = schema?.enums.length ?? 0
  const relationCount = schema?.relations.length ?? 0

  return (
    <header className="flex flex-wrap items-center gap-4 border-b px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="font-heading font-medium text-base">erdflow</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{entityCount} tables</Badge>
          <Badge variant="secondary">{enumCount} enums</Badge>
          <Badge variant="secondary">{relationCount} relations</Badge>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            isSelected={showRelations}
            onChange={setShowRelations}
            aria-label="Show relationships"
          />
          <span className="whitespace-nowrap text-sm">Show relationships</span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <TooltipTrigger>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Zoom out"
              onPress={() => canvasControls?.zoomOut()}
            >
              <MinusIcon />
            </Button>
            <Tooltip>Zoom out</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Zoom in"
              onPress={() => canvasControls?.zoomIn()}
            >
              <PlusIcon />
            </Button>
            <Tooltip>Zoom in</Tooltip>
          </TooltipTrigger>
          <TooltipTrigger>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Fit view"
              onPress={() => canvasControls?.fitView()}
            >
              <Maximize2Icon />
            </Button>
            <Tooltip>Fit view</Tooltip>
          </TooltipTrigger>
        </div>

        {focusedEntityId ? (
          <Button variant="ghost" size="sm" onPress={clearFocus}>
            <FocusIcon data-icon="inline-start" />
            Clear focus
          </Button>
        ) : null}
      </div>
    </header>
  )
}
