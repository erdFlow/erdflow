import type { UniversalSchema } from "../schema/types.js"

export interface ProjectContext {
  rootDir: string
}

export interface ParseOptions {
  filePath?: string
  dialect?: "postgresql" | "mysql" | "sqlite"
}

export interface SchemaAdapter {
  readonly name: string
  detect(project: ProjectContext): Promise<boolean>
  parse(input: string, options?: ParseOptions): Promise<UniversalSchema>
  generate?(schema: UniversalSchema): Promise<string>
}
