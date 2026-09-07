import { readFile } from "node:fs/promises"
import type { UniversalSchema } from "@erdflow/core"
import { applyMigrationOps } from "./apply-migrations.js"
import { collectEloquentDraftRelations } from "./eloquent-relations.js"
import { mapTableMapToSchema } from "./map-schema.js"
import { mergeEloquentRelations } from "./merge-relations.js"
import { parseEloquentModel } from "./parse-model.js"
import { parseMigrationSource } from "./parse-migration.js"
import { findModelFiles } from "./scan-models.js"
import { findMigrationFiles } from "./scan.js"

/** Load migrations, then enrich relations from Eloquent models. */
export async function loadLaravelSchema(
  rootDir: string
): Promise<UniversalSchema> {
  const files = await findMigrationFiles(rootDir)
  if (files.length === 0) {
    throw new Error(
      `No Laravel migration files found under ${rootDir}/database/migrations`
    )
  }

  const ops = []
  for (const filePath of files) {
    const source = await readFile(filePath, "utf8")
    ops.push(...parseMigrationSource(source))
  }

  const tables = applyMigrationOps(ops)
  const schema = mapTableMapToSchema(tables, {
    source: rootDir,
    adapter: "laravel",
  })

  const modelFiles = await findModelFiles(rootDir)
  if (modelFiles.length === 0) {
    return schema
  }

  const models = []
  for (const filePath of modelFiles) {
    const source = await readFile(filePath, "utf8")
    const parsed = parseEloquentModel(source)
    if (parsed) {
      models.push(parsed)
    }
  }

  const tableNames = new Set(tables.keys())
  const drafts = collectEloquentDraftRelations(models, tableNames)
  return mergeEloquentRelations(schema, drafts)
}
