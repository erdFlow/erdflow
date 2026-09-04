import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { useDiagramStore } from "../../store/diagram-store.js"
import { SchemaCanvas } from "../canvas/SchemaCanvas.js"
import { Footer } from "./Footer.js"
import { Header } from "./Header.js"
import { SidebarPanel } from "./SidebarPanel.js"
import { SqlViewPanel } from "./SqlViewPanel.js"

export function AppShell() {
  const error = useDiagramStore((state) => state.error)
  const showSqlView = useDiagramStore((state) => state.showSqlView)

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
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <SchemaCanvas />
            </div>
            {showSqlView ? <SqlViewPanel /> : null}
          </div>
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
