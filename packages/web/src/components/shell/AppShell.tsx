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
import { SQL_VIEW_WIDTH_MAX, SQL_VIEW_WIDTH_MIN } from "../../data/constants.js"
import { useDiagramStore } from "../../store/diagram-store.js"
import { SchemaCanvas } from "../canvas/SchemaCanvas.js"
import { Footer } from "./Footer.js"
import { Header } from "./Header.js"
import { SidebarPanel } from "./SidebarPanel.js"
import { SqlViewPanel } from "./SqlViewPanel.js"

export function AppShell() {
  const error = useDiagramStore((state) => state.error)
  const showSqlView = useDiagramStore((state) => state.showSqlView)
  const sqlViewWidth = useDiagramStore((state) => state.sqlViewWidth)
  const setSqlViewWidth = useDiagramStore((state) => state.setSqlViewWidth)

  return (
    <SidebarProvider>
      <SidebarPanel />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <Header />
          {error ? (
            <Alert variant="destructive" className="mx-4 mt-4">
              <AlertTitle>Schema error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex min-h-0 flex-1">
            {showSqlView ? (
              <ResizablePanelGroup
                orientation="horizontal"
                className="min-h-0 flex-1"
              >
                <ResizablePanel
                  id="canvas"
                  minSize="30%"
                  className="min-h-0 min-w-0"
                >
                  <div className="flex size-full min-h-0 flex-col">
                    <SchemaCanvas />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel
                  id="sql-view"
                  defaultSize={sqlViewWidth}
                  minSize={SQL_VIEW_WIDTH_MIN}
                  maxSize={SQL_VIEW_WIDTH_MAX}
                  groupResizeBehavior="preserve-pixel-size"
                  className="min-h-0"
                  onResize={(size) => {
                    setSqlViewWidth(size.inPixels)
                  }}
                >
                  <SqlViewPanel />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <SchemaCanvas />
              </div>
            )}
          </div>
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
