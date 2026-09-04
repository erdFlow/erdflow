import { HotkeysProvider } from "@tanstack/react-hotkeys"
import { useCanvasHotkeys } from "../hooks/use-canvas-hotkeys.js"
import { useSchemaSocket } from "../hooks/use-schema-socket.js"
import { AppShell } from "./shell/AppShell.js"

function VisualizerApp() {
  useSchemaSocket()
  useCanvasHotkeys()
  return <AppShell />
}

export function ErdflowVisualizer() {
  return (
    <HotkeysProvider
      defaultOptions={{
        hotkey: { preventDefault: true, ignoreInputs: true },
      }}
    >
      <VisualizerApp />
    </HotkeysProvider>
  )
}
