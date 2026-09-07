import { relative, resolve } from "node:path"
import type { UniversalSchema } from "@erdflow/core"

export function printDetectionSummary(
  rootDir: string,
  migrationsLabel: string,
  schema: UniversalSchema,
  url: string
): void {
  const relativePath = relative(rootDir, migrationsLabel) || migrationsLabel

  console.log("")
  console.log("✓ Detected Laravel")
  console.log(`✓ ${relativePath}`)
  console.log(
    `✓ ${schema.entities.length} entities · ${schema.enums.length} enums · ${schema.relations.length} relations · ${schema.indexes.length} indexes`
  )
  console.log(`→ ${url}`)
  console.log("")
}

export function printWatchEnabled(): void {
  console.log("Watching migrations and models for changes...")
}

export function printSchemaUpdated(schema: UniversalSchema): void {
  console.log(
    `Schema updated · ${schema.entities.length} entities · ${schema.enums.length} enums · ${schema.relations.length} relations`
  )
}

export function printUnsupportedProject(message: string): void {
  console.error("")
  console.error("✗ No Laravel project found")
  console.error(`  ${message}`)
  console.error("")
  console.error("Supported:")
  console.error("  • Laravel app with database/migrations/*.php")
  console.error("  • Run from project root (artisan or composer.json)")
  console.error("  • Or pass --root <path> to the Laravel app")
  console.error("")
}

export function printParseError(filePath: string, message: string): void {
  console.error("")
  console.error("✗ Schema parse error")
  console.error(`  file: ${filePath}`)
  console.error(`  ${message}`)
  console.error("")
}

export function printCliError(error: unknown): void {
  if (
    error instanceof Error &&
    (error.message.startsWith("No Laravel") ||
      error.message.startsWith("No schema") ||
      error.message.includes("migration"))
  ) {
    printUnsupportedProject(error.message)
    return
  }

  const message = error instanceof Error ? error.message : String(error)
  console.error("")
  console.error(`✗ ${message}`)
  console.error("")
}

export function resolveRootDir(cwd: string, rootFlag?: string): string {
  return rootFlag ? resolve(cwd, rootFlag) : cwd
}
