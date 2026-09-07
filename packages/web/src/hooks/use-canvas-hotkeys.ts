import { useHotkeys } from "@tanstack/react-hotkeys"
import {
  HOTKEY_CLEAR_FOCUS,
  HOTKEY_FIT_VIEW,
  HOTKEY_ZOOM_IN,
  HOTKEY_ZOOM_OUT,
} from "../data/constants.js"
import { useDiagramStore } from "../store/diagram-store.js"

/** Register canvas zoom / focus shortcuts (ignored while typing in inputs). */
export function useCanvasHotkeys() {
  const clearFocus = useDiagramStore((state) => state.clearFocus)

  useHotkeys(
    [
      {
        hotkey: HOTKEY_ZOOM_IN,
        callback: () => {
          useDiagramStore.getState().canvasControls?.zoomIn()
        },
      },
      {
        hotkey: HOTKEY_ZOOM_OUT,
        callback: () => {
          useDiagramStore.getState().canvasControls?.zoomOut()
        },
      },
      {
        hotkey: HOTKEY_FIT_VIEW,
        callback: () => {
          useDiagramStore.getState().canvasControls?.fitView()
        },
      },
      {
        hotkey: HOTKEY_CLEAR_FOCUS,
        callback: () => {
          clearFocus()
        },
      },
    ],
    {
      preventDefault: true,
      ignoreInputs: true,
    }
  )
}
