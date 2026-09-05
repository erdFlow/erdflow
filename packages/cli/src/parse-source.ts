import { readFile } from "node:fs/promises"
import type { UniversalSchema } from "@erdflow/core"
import { loadPrismaDatamodel } from "@erdflow/parser-prisma"
import type { ResolvedSource } from "./scan.js"

export async function loadSchema(
  source: ResolvedSource
): Promise<UniversalSchema> {
  const content =
    source.adapterName === "prisma" && source.schemaFiles?.length
      ? await loadPrismaDatamodel(source.schemaFiles)
      : await readFile(source.filePath, "utf8")

  return source.adapter.parse(content, {
    filePath: source.filePath,
    dialect: source.dialect,
  })
}
