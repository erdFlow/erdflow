import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  DownloadIcon,
  FileCode2Icon,
  ImageIcon,
  Loader2Icon,
} from "lucide-react"
import { useState } from "react"
import {
  EXPORT_ARIA_LABEL,
  EXPORT_EXPORTING_ARIA_LABEL,
  EXPORT_PNG_LABEL,
  EXPORT_SVG_LABEL,
} from "../../data/labels.js"
import {
  exportDiagramPng,
  exportDiagramSvg,
  suggestedDiagramFilename,
} from "../../lib/export-diagram.js"
import { saveBlobFile, saveTextFile } from "../../lib/save-text-file.js"
import { useDiagramStore } from "../../store/diagram-store.js"
import { useTheme } from "../theme-provider.js"

function exportBackgroundColor(isDark: boolean): string {
  return isDark ? "#0a0a0a" : "#ffffff"
}

async function exportDiagramAsPng(backgroundColor: string): Promise<void> {
  const schema = useDiagramStore.getState().schema
  if (!schema || useDiagramStore.getState().nodes.length === 0) {
    return
  }

  try {
    const blob = await exportDiagramPng({ backgroundColor })
    await saveBlobFile({
      blob,
      suggestedName: suggestedDiagramFilename(schema, ".png"),
      description: "PNG",
      mimeType: "image/png",
      extension: ".png",
    })
  } catch {
    // Quiet failure: missing viewport / empty diagram / user cancel already handled
  }
}

async function exportDiagramAsSvg(backgroundColor: string): Promise<void> {
  const schema = useDiagramStore.getState().schema
  if (!schema || useDiagramStore.getState().nodes.length === 0) {
    return
  }

  try {
    const svg = await exportDiagramSvg({ backgroundColor })
    if (!svg.trim()) {
      return
    }
    await saveTextFile({
      contents: svg.endsWith("\n") ? svg : `${svg}\n`,
      suggestedName: suggestedDiagramFilename(schema, ".svg"),
      description: "SVG",
      mimeType: "image/svg+xml",
      extension: ".svg",
    })
  } catch {
    // Quiet failure
  }
}

/** Header export menu: PNG/SVG capture of the diagram canvas. */
export function ExportMenu() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const backgroundColor = exportBackgroundColor(isDark)
  const [isExporting, setIsExporting] = useState(false)

  async function runExport(exportFn: () => Promise<void>): Promise<void> {
    if (isExporting) {
      return
    }
    setIsExporting(true)
    try {
      await exportFn()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenuTrigger>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={
          isExporting ? EXPORT_EXPORTING_ARIA_LABEL : EXPORT_ARIA_LABEL
        }
        aria-busy={isExporting}
        isDisabled={isExporting}
      >
        {isExporting ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <DownloadIcon />
        )}
      </Button>
      <DropdownMenu placement="bottom end" className="min-w-36">
        <DropdownMenuItem
          textValue={EXPORT_PNG_LABEL}
          isDisabled={isExporting}
          onAction={() => {
            void runExport(() => exportDiagramAsPng(backgroundColor))
          }}
        >
          <ImageIcon />
          {EXPORT_PNG_LABEL}
        </DropdownMenuItem>
        <DropdownMenuItem
          textValue={EXPORT_SVG_LABEL}
          isDisabled={isExporting}
          onAction={() => {
            void runExport(() => exportDiagramAsSvg(backgroundColor))
          }}
        >
          <FileCode2Icon />
          {EXPORT_SVG_LABEL}
        </DropdownMenuItem>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
