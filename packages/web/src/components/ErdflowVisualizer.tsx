import { HotkeysProvider } from "@tanstack/react-hotkeys"
import { useCanvasHotkeys } from "../hooks/use-canvas-hotkeys.js"
import { useSchemaSocket } from "../hooks/use-schema-socket.js"
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
      <HotkeysProvider
        defaultOptions={{
          hotkey: { preventDefault: true, ignoreInputs: true },
        }}
      >
        <VisualizerApp />
      </HotkeysProvider>
    </ThemeProvider>
  )
}
