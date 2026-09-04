import type { LayoutResult } from "./types.js"

export class LayoutCache {
  private readonly entries = new Map<string, LayoutResult>()

  get(key: string): LayoutResult | undefined {
    return this.entries.get(key)
  }

  set(key: string, result: LayoutResult): void {
    this.entries.set(key, result)
  }

  clear(): void {
    this.entries.clear()
  }

  get size(): number {
    return this.entries.size
  }
}

export const defaultLayoutCache = new LayoutCache()

export function createLayoutCache(): LayoutCache {
  return new LayoutCache()
}

export function clearLayoutCache(): void {
  defaultLayoutCache.clear()
}
