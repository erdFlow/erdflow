import { useHotkeys } from "@tanstack/react-hotkeys"
import { HOTKEY_ZOOM_IN, HOTKEY_ZOOM_OUT } from "../data/constants.js"
import { useDiagramStore } from "../store/diagram-store.js"

/** Register canvas zoom shortcuts (ignored while typing in inputs). */
export function useCanvasHotkeys() {
  const canvasControls = useDiagramStore((state) => state.canvasControls)

  useHotkeys(
    [
      {
        hotkey: HOTKEY_ZOOM_IN,
        callback: () => {
          canvasControls?.zoomIn()
        },
      },
      {
        hotkey: HOTKEY_ZOOM_OUT,
        callback: () => {
          canvasControls?.zoomOut()
        },
      },
    ],
    {
      preventDefault: true,
      ignoreInputs: true,
    }
  )
}
