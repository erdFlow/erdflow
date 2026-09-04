import { Parser } from "@dbml/core"
import type { ParseOptions, SchemaAdapter } from "@erdflow/core"
import { detectDbmlProject } from "./detect.js"
import { mapDbmlDatabase } from "./map-database.js"

export const dbmlAdapter: SchemaAdapter = {
  name: "dbml",

  async detect(project) {
    return detectDbmlProject(project.rootDir)
  },

  async parse(input, options?: ParseOptions) {
    const parser = new Parser()
    const database = parser.parse(input, "dbmlv2")
    return mapDbmlDatabase(database, {
      source: options?.filePath,
      adapter: "dbml",
    })
  },
}
