import { formatForDisplay } from "@tanstack/react-hotkeys"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { Switch } from "@workspace/ui/components/switch"
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
import {
  SETTINGS_LABEL,
  SHOW_MINIMAP_LABEL,
  SHOW_RELATIONSHIPS_LABEL,
  THEME_DARK_LABEL,
  THEME_LABEL,
  THEME_LIGHT_LABEL,
  THEME_SYSTEM_LABEL,
} from "../../data/labels.js"
import { useDiagramStore } from "../../store/diagram-store.js"
import { useTheme } from "../theme-provider.js"

function ViewToggleItem({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <DropdownMenuItem
      textValue={label}
      onAction={onToggle}
      className="justify-between gap-4"
    >
      <span>{label}</span>
      <Switch
        size="sm"
        isSelected={checked}
        aria-label={label}
        className="pointer-events-none"
      />
    </DropdownMenuItem>
  )
}

function ThemeOption({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <DropdownMenuItem textValue={label} onAction={onSelect}>
      <span className="flex size-4 shrink-0 items-center justify-center">
        {selected ? <CheckIcon /> : null}
      </span>
      {label}
    </DropdownMenuItem>
  )
}

export function Header() {
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)
  const showRelations = useDiagramStore((state) => state.showRelations)
  const showMinimap = useDiagramStore((state) => state.showMinimap)
  const setShowMinimap = useDiagramStore((state) => state.setShowMinimap)
  const canvasControls = useDiagramStore((state) => state.canvasControls)
  const clearFocus = useDiagramStore((state) => state.clearFocus)
  const setShowRelations = useDiagramStore((state) => state.setShowRelations)
  const { theme, setTheme } = useTheme()

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
        <DropdownMenu placement="bottom end" className="min-w-44">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger textValue="View">
              View
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent placement="left top" className="min-w-56">
              <ViewToggleItem
                label={SHOW_RELATIONSHIPS_LABEL}
                checked={showRelations}
                onToggle={() => setShowRelations(!showRelations)}
              />
              <ViewToggleItem
                label={SHOW_MINIMAP_LABEL}
                checked={showMinimap}
                onToggle={() => setShowMinimap(!showMinimap)}
              />
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger textValue={SETTINGS_LABEL}>
              {SETTINGS_LABEL}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent placement="left top" className="min-w-44">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger textValue={THEME_LABEL}>
                  {THEME_LABEL}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  placement="left top"
                  className="min-w-40"
                >
                  <ThemeOption
                    label={THEME_LIGHT_LABEL}
                    selected={theme === "light"}
                    onSelect={() => setTheme("light")}
                  />
                  <ThemeOption
                    label={THEME_DARK_LABEL}
                    selected={theme === "dark"}
                    onSelect={() => setTheme("dark")}
                  />
                  <ThemeOption
                    label={THEME_SYSTEM_LABEL}
                    selected={theme === "system"}
                    onSelect={() => setTheme("system")}
                  />
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

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
