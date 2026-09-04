import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { useRef } from "react"
import {
  SQL_VIEW_WIDTH_DEFAULT,
  SQL_VIEW_WIDTH_MAX,
  SQL_VIEW_WIDTH_MIN,
} from "../../data/constants.js"
import { useDiagramStore } from "../../store/diagram-store.js"
import { SchemaCanvas } from "../canvas/SchemaCanvas.js"
import { Footer } from "./Footer.js"
import { Header } from "./Header.js"
import { RelationshipTablePanel } from "./RelationshipTablePanel.js"
import { SidebarPanel } from "./SidebarPanel.js"
import { SqlViewPanel } from "./SqlViewPanel.js"

/** Mounted only while SQL View is open so defaultSize is frozen for the drag session. */
function SqlResizableLayout() {
  const sqlViewWidth = useDiagramStore((state) => state.sqlViewWidth)
  const setSqlViewWidth = useDiagramStore((state) => state.setSqlViewWidth)
  const initialSqlWidth = useRef(
    sqlViewWidth > 0 ? sqlViewWidth : SQL_VIEW_WIDTH_DEFAULT
  ).current

  return (
    <ResizablePanelGroup
      id="erd-sql-layout"
      orientation="horizontal"
      className="h-full min-h-0 w-full"
    >
      <ResizablePanel
        id="canvas"
        defaultSize="70%"
        minSize="30%"
        className="min-h-0 min-w-0"
      >
        <div className="relative flex size-full min-h-0 flex-col">
          <SchemaCanvas />
          <RelationshipTableOverlay />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        id="sql-view"
        defaultSize={initialSqlWidth}
        minSize={SQL_VIEW_WIDTH_MIN}
        maxSize={SQL_VIEW_WIDTH_MAX}
        groupResizeBehavior="preserve-pixel-size"
        className="min-h-0"
        onResize={(size, _id, prevSize) => {
          // Skip the initial mount callback; only persist real resizes.
          if (prevSize === undefined) {
            return
          }
          setSqlViewWidth(size.inPixels)
        }}
      >
        <SqlViewPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function RelationshipTableOverlay() {
  const showRelationshipTable = useDiagramStore(
    (state) => state.showRelationshipTable
  )
  const focusedEntityId = useDiagramStore((state) => state.focusedEntityId)

  if (!(showRelationshipTable && focusedEntityId)) {
    return null
  }

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-20">
      <div className="pointer-events-auto">
        <RelationshipTablePanel />
      </div>
    </div>
  )
}

export function AppShell() {
  const error = useDiagramStore((state) => state.error)
  const showSqlView = useDiagramStore((state) => state.showSqlView)

  return (
    <SidebarProvider>
      <SidebarPanel />
      <SidebarInset>
        <div className="flex h-svh min-h-0 flex-col">
          <Header />
          {error ? (
            <Alert variant="destructive" className="mx-4 mt-4 shrink-0">
              <AlertTitle>Schema error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="relative flex min-h-0 flex-1 flex-col">
            {showSqlView ? (
              <SqlResizableLayout />
            ) : (
              <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
                <SchemaCanvas />
                <RelationshipTableOverlay />
              </div>
            )}
          </div>
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
