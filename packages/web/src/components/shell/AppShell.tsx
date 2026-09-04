import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { useDiagramStore } from "../../store/diagram-store.js"
import { SchemaCanvas } from "../canvas/SchemaCanvas.js"
import { Footer } from "./Footer.js"
import { Header } from "./Header.js"
import { SidebarPanel } from "./SidebarPanel.js"

export function AppShell() {
  const error = useDiagramStore((state) => state.error)

  return (
    <SidebarProvider>
      <SidebarPanel />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-2 md:hidden">
            <SidebarTrigger />
          </div>
          <Header />
          {error ? (
            <Alert variant="destructive" className="mx-4 mt-4">
              <AlertTitle>Schema error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col">
            <SchemaCanvas />
          </div>
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
