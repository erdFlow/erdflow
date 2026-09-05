/**
 * Save text via the system file picker when available; otherwise trigger a
 * browser download. Never opens an in-app modal.
 */
export async function saveTextFile(options: {
  contents: string
  suggestedName: string
  description?: string
  mimeType?: string
  extension?: string
}): Promise<"saved" | "cancelled" | "downloaded"> {
  const mimeType = options.mimeType ?? "text/plain;charset=utf-8"
  const extension = options.extension ?? ".txt"
  const acceptKey = mimeType.split(";")[0] ?? "text/plain"

  const picker = (
    window as Window & {
      showSaveFilePicker?: (options?: {
        suggestedName?: string
        types?: Array<{
          description?: string
          accept: Record<string, string[]>
        }>
      }) => Promise<FileSystemFileHandle>
    }
  ).showSaveFilePicker

  if (typeof picker === "function") {
    try {
      const handle = await picker({
        suggestedName: options.suggestedName,
        types: [
          {
            description: options.description ?? "File",
            accept: {
              [acceptKey]: [extension],
            },
          },
        ],
      })
      const writable = await handle.createWritable()
      try {
        await writable.write(options.contents)
      } finally {
        await writable.close()
      }
      return "saved"
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled"
      }
      // Fall through to download for unsupported / permission errors.
    }
  }

  const blob = new Blob([options.contents], { type: mimeType })
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = options.suggestedName
    anchor.rel = "noopener"
    anchor.style.display = "none"
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(url)
  }

  return "downloaded"
}
