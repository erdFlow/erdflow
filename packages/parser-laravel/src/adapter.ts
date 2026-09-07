import type { ParseOptions, SchemaAdapter } from "@erdflow/core"
import { applyMigrationOps } from "./apply-migrations.js"
import { detectLaravelProject } from "./detect.js"
import { mapTableMapToSchema } from "./map-schema.js"
import { parseMigrationSource } from "./parse-migration.js"

export const laravelAdapter: SchemaAdapter = {
  name: "laravel",

  async detect(project) {
    return detectLaravelProject(project.rootDir)
  },

  async parse(input, options?: ParseOptions) {
    const ops = parseMigrationSource(input)
    const tables = applyMigrationOps(ops)
    return mapTableMapToSchema(tables, {
      source: options?.filePath,
      adapter: "laravel",
    })
  },
}
