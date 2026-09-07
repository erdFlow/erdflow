import type { Dirent } from "node:fs"
import { access, readdir, readFile, stat } from "node:fs/promises"
import { isAbsolute, join, resolve } from "node:path"

const MAX_DEPTH = 4

const PRISMA_CONFIG_FILES = [
  "prisma.config.ts",
  "prisma.config.mjs",
  "prisma.config.js",
] as const

/** Static extract of `schema: '...'` from prisma.config.* (does not execute the file). */
const SCHEMA_PATH_RE = /(?:^|[,\s{])schema\s*:\s*['"`]([^'"`]+)['"`]/m

export type PrismaSchemaSource =
  | "explicit"
  | "prisma-config"
  | "package-json"
  | "default"
  | "schema-dir"
  | "root-schema"

export type PrismaSchemaLocation = {
  /** File or directory that owns the schema. */
  rootPath: string
  /** Absolute `.prisma` file paths, sorted. */
  files: string[]
  source: PrismaSchemaSource
  /** Absolute path to prisma.config.* when used for resolution. */
  configPath?: string
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function findPrismaFiles(dir: string, depth: number): Promise<string[]> {
  if (depth > MAX_DEPTH) {
    return []
  }

  const results: string[] = []
  let entries: Dirent[]
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return results
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") {
      continue
    }

    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await findPrismaFiles(fullPath, depth + 1)))
      continue
    }

    if (entry.isFile() && entry.name.endsWith(".prisma")) {
      results.push(fullPath)
    }
  }

  return results
}

async function readPackageJson(
  rootDir: string
): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(join(rootDir, "package.json"), "utf8")
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function stripLineComments(source: string): string {
  return source.replace(/^\s*\/\/.*$/gm, "")
}

/**
 * Reads prisma.config.ts|js|mjs and extracts a string `schema:` path without executing the file.
 */
export async function readPrismaConfigSchemaPath(
  rootDir: string
): Promise<{ configPath: string; schemaPath: string } | null> {
  for (const name of PRISMA_CONFIG_FILES) {
    const configPath = join(rootDir, name)
    if (!(await exists(configPath))) {
      continue
    }

    try {
      const raw = await readFile(configPath, "utf8")
      const match = stripLineComments(raw).match(SCHEMA_PATH_RE)
      if (match?.[1]) {
        return { configPath, schemaPath: match[1] }
      }
    } catch {}
  }

  return null
}

/**
 * Expand a schema root (file or directory) into sorted absolute `.prisma` paths.
 */
export async function expandPrismaSchemaRoot(
  rootPath: string
): Promise<string[]> {
  let info
  try {
    info = await stat(rootPath)
  } catch {
    return []
  }

  if (info.isFile()) {
    return rootPath.endsWith(".prisma") ? [rootPath] : []
  }

  if (info.isDirectory()) {
    const files = await findPrismaFiles(rootPath, 0)
    return files.sort((a, b) => a.localeCompare(b))
  }

  return []
}

function toAbsolute(rootDir: string, inputPath: string): string {
  return isAbsolute(inputPath) ? inputPath : resolve(rootDir, inputPath)
}

async function locationFromRoot(
  rootPath: string,
  source: PrismaSchemaSource,
  configPath?: string
): Promise<PrismaSchemaLocation | null> {
  const files = await expandPrismaSchemaRoot(rootPath)
  if (files.length === 0) {
    return null
  }

  return {
    rootPath,
    files,
    source,
    configPath,
  }
}

/**
 * Resolve schema location for an explicit CLI path (file or directory).
 */
export async function resolvePrismaSchemaLocationFromPath(
  rootDir: string,
  inputPath: string
): Promise<PrismaSchemaLocation | null> {
  const rootPath = toAbsolute(rootDir, inputPath)
  return locationFromRoot(rootPath, "explicit")
}

/**
 * Auto-resolve Prisma schema location (v6 + v7 layouts).
 *
 * Order: prisma.config → package.json → prisma/schema.prisma →
 * prisma/schema/ → schema.prisma at project root.
 */
export async function resolvePrismaSchemaLocation(
  rootDir: string
): Promise<PrismaSchemaLocation | null> {
  const fromConfig = await readPrismaConfigSchemaPath(rootDir)
  if (fromConfig) {
    const rootPath = toAbsolute(rootDir, fromConfig.schemaPath)
    const location = await locationFromRoot(
      rootPath,
      "prisma-config",
      fromConfig.configPath
    )
    if (location) {
      return location
    }
  }

  const pkg = await readPackageJson(rootDir)
  const prismaPkg = pkg?.prisma as { schema?: string } | undefined
  if (prismaPkg?.schema) {
    const rootPath = toAbsolute(rootDir, prismaPkg.schema)
    const location = await locationFromRoot(rootPath, "package-json")
    if (location) {
      return location
    }
  }

  const defaultFile = join(rootDir, "prisma", "schema.prisma")
  if (await exists(defaultFile)) {
    const location = await locationFromRoot(defaultFile, "default")
    if (location) {
      return location
    }
  }

  const schemaDir = join(rootDir, "prisma", "schema")
  if (await exists(schemaDir)) {
    const location = await locationFromRoot(schemaDir, "schema-dir")
    if (location) {
      return location
    }
  }

  const rootSchema = join(rootDir, "schema.prisma")
  if (await exists(rootSchema)) {
    return locationFromRoot(rootSchema, "root-schema")
  }

  return null
}

export async function detectPrismaProject(rootDir: string): Promise<boolean> {
  const location = await resolvePrismaSchemaLocation(rootDir)
  return location !== null
}

/** @deprecated Prefer resolvePrismaSchemaLocation; returns first schema file only. */
export async function resolvePrismaSchemaPath(
  rootDir: string
): Promise<string | null> {
  const location = await resolvePrismaSchemaLocation(rootDir)
  return location?.files[0] ?? null
}
