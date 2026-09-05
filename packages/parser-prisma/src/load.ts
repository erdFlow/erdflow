import { readFile } from "node:fs/promises"
import type { SchemaMeta, UniversalSchema } from "@erdflow/core"
import type { PrismaSchemaLocation } from "./detect.js"
import { parsePrismaSchema } from "./parse.js"

/**
 * Read and concatenate Prisma schema fragments (multi-file convention).
 */
export async function loadPrismaDatamodel(files: string[]): Promise<string> {
  if (files.length === 0) {
    throw new Error("No Prisma schema files to load")
  }

  const contents = await Promise.all(
    files.map(async (filePath) => readFile(filePath, "utf8"))
  )
  return contents.join("\n")
}

export async function parsePrismaSchemaFromLocation(
  location: PrismaSchemaLocation,
  meta?: SchemaMeta
): Promise<UniversalSchema> {
  const input = await loadPrismaDatamodel(location.files)
  return parsePrismaSchema(input, {
    ...meta,
    source: meta?.source ?? location.rootPath,
  })
}
