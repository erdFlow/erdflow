import open from "open"

export async function openBrowser(url: string): Promise<void> {
  try {
    await open(url)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`Could not open browser: ${message}`)
    console.warn(`Open manually: ${url}`)
  }
}
