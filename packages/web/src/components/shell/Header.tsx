import { formatForDisplay } from "@tanstack/react-hotkeys"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import {
  CheckIcon,
  FocusIcon,
  Maximize2Icon,
  MinusIcon,
  MoreVerticalIcon,
  PlusIcon,
} from "lucide-react"
import {
  BRAND_NAME,
  HOTKEY_ZOOM_IN,
  HOTKEY_ZOOM_OUT,
} from "../../data/constants.js"
import { useDiagramStore } from "../../store/diagram-store.js"

export function Header() {
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)
  const showRelations = useDiagramStore((state) => state.showRelations)
  const canvasControls = useDiagramStore((state) => state.canvasControls)
  const clearFocus = useDiagramStore((state) => state.clearFocus)
  const setShowRelations = useDiagramStore((state) => state.setShowRelations)

  const zoomInShortcut = formatForDisplay(HOTKEY_ZOOM_IN)
  const zoomOutShortcut = formatForDisplay(HOTKEY_ZOOM_OUT)

  return (
    <header className="flex items-center gap-4 border-b px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger />
        <h1 className="font-heading font-medium text-base">{BRAND_NAME}</h1>
      </div>

      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon-sm" aria-label="Actions">
          <MoreVerticalIcon />
        </Button>
        <DropdownMenu placement="bottom end" className="min-w-52">
          <DropdownMenuLabel>View</DropdownMenuLabel>
          <DropdownMenuItem
            textValue="Show relationships"
            onAction={() => setShowRelations(!showRelations)}
          >
            <span className="flex size-4 shrink-0 items-center justify-center">
              {showRelations ? <CheckIcon /> : null}
            </span>
            Show relationships
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Canvas</DropdownMenuLabel>
          <DropdownMenuItem
            textValue="Zoom in"
            onAction={() => canvasControls?.zoomIn()}
          >
            <PlusIcon />
            Zoom in
            <DropdownMenuShortcut>{zoomInShortcut}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            textValue="Zoom out"
            onAction={() => canvasControls?.zoomOut()}
          >
            <MinusIcon />
            Zoom out
            <DropdownMenuShortcut>{zoomOutShortcut}</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            textValue="Fit view"
            onAction={() => canvasControls?.fitView()}
          >
            <Maximize2Icon />
            Fit view
          </DropdownMenuItem>

          {focusedEntityId ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                textValue="Clear focus"
                onAction={() => clearFocus()}
              >
                <FocusIcon />
                Clear focus
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenu>
      </DropdownMenuTrigger>
    </header>
  )
}
