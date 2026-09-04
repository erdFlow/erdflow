import { readFile } from "node:fs/promises"
import type { UniversalSchema } from "@erdflow/core"
import type { ResolvedSource } from "./scan.js"

export async function loadSchema(
  source: ResolvedSource
): Promise<UniversalSchema> {
  const content = await readFile(source.filePath, "utf8")
  return source.adapter.parse(content, {
    filePath: source.filePath,
    dialect: source.dialect,
  })
}
