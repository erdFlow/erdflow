import type { UniversalSchema } from "@erdflow/core"
import { getNodesBounds, getViewportForBounds } from "@xyflow/react"
import { toPng, toSvg } from "html-to-image"
import { useDiagramStore } from "../store/diagram-store.js"

const VIEWPORT_SELECTOR = ".react-flow__viewport"
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const FIT_PADDING = 0.1
const MAX_DIMENSION = 8192

function schemaBasename(schema: UniversalSchema | null): string {
  const source = schema?.meta?.source
  if (source) {
    const base = source
      .split(/[/\\]/)
      .pop()
      ?.replace(/\.[^.]+$/, "")
      ?.trim()
    if (base) {
      return base
    }
  }
  return "schema"
}

export function suggestedDiagramFilename(
  schema: UniversalSchema | null,
  extension: ".png" | ".svg"
): string {
  return `${schemaBasename(schema)}${extension}`
}

function resolveExportSize(bounds: {
  x: number
  y: number
  width: number
  height: number
}): { width: number; height: number } {
  let width = Math.max(1, Math.ceil(bounds.width))
  let height = Math.max(1, Math.ceil(bounds.height))

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    width = Math.max(1, Math.floor(width * scale))
    height = Math.max(1, Math.floor(height * scale))
  }

  return { width, height }
}

function getViewportElement(): HTMLElement {
  const element = document.querySelector(VIEWPORT_SELECTOR)
  if (!(element instanceof HTMLElement)) {
    throw new Error("Diagram viewport not found")
  }
  return element
}

async function captureOptions(backgroundColor: string): Promise<{
  element: HTMLElement
  width: number
  height: number
  style: Partial<CSSStyleDeclaration> & Record<string, string>
  backgroundColor: string
}> {
  const nodes = useDiagramStore.getState().nodes
  if (nodes.length === 0) {
    throw new Error("No diagram nodes to export")
  }

  const bounds = getNodesBounds(nodes)
  const { width, height } = resolveExportSize(bounds)
  const viewport = getViewportForBounds(
    bounds,
    width,
    height,
    MIN_ZOOM,
    MAX_ZOOM,
    FIT_PADDING
  )
  const element = getViewportElement()

  return {
    element,
    width,
    height,
    backgroundColor,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data = ""] = dataUrl.split(",")
  const isBase64 = header?.includes("base64")
  const mime = header?.match(/data:([^;]+)/)?.[1] ?? "application/octet-stream"
  const binary = isBase64 ? atob(data) : decodeURIComponent(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

function dataUrlToSvgString(dataUrl: string): string {
  if (dataUrl.startsWith("data:image/svg+xml;base64,")) {
    return atob(dataUrl.slice("data:image/svg+xml;base64,".length))
  }
  if (dataUrl.startsWith("data:image/svg+xml,")) {
    return decodeURIComponent(dataUrl.slice("data:image/svg+xml,".length))
  }
  if (dataUrl.startsWith("data:image/svg+xml;charset=utf-8,")) {
    return decodeURIComponent(
      dataUrl.slice("data:image/svg+xml;charset=utf-8,".length)
    )
  }
  return dataUrl
}

/** Capture the React Flow viewport as a PNG blob. */
export async function exportDiagramPng(options: {
  backgroundColor: string
}): Promise<Blob> {
  const capture = await captureOptions(options.backgroundColor)
  const dataUrl = await toPng(capture.element, {
    backgroundColor: capture.backgroundColor,
    width: capture.width,
    height: capture.height,
    style: capture.style,
    pixelRatio: 2,
  })
  return dataUrlToBlob(dataUrl)
}

/** Capture the React Flow viewport as an SVG document string. */
export async function exportDiagramSvg(options: {
  backgroundColor: string
}): Promise<string> {
  const capture = await captureOptions(options.backgroundColor)
  const dataUrl = await toSvg(capture.element, {
    backgroundColor: capture.backgroundColor,
    width: capture.width,
    height: capture.height,
    style: capture.style,
  })
  return dataUrlToSvgString(dataUrl)
}
