import { HotkeysProvider } from "@tanstack/react-hotkeys"
import { ErrorBoundary } from "react-error-boundary"
import { useCanvasHotkeys } from "../hooks/use-canvas-hotkeys.js"
import { useSchemaSocket } from "../hooks/use-schema-socket.js"
import { AppErrorFallback } from "./shell/AppErrorFallback.js"
import { AppShell } from "./shell/AppShell.js"
import { ThemeProvider } from "./theme-provider.js"

function VisualizerApp() {
  useSchemaSocket()
  useCanvasHotkeys()
  return <AppShell />
}

export function ErdflowVisualizer() {
  return (
    <ThemeProvider>
      <ErrorBoundary FallbackComponent={AppErrorFallback}>
        <HotkeysProvider
          defaultOptions={{
            hotkey: { preventDefault: true, ignoreInputs: true },
          }}
        >
          <VisualizerApp />
        </HotkeysProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
