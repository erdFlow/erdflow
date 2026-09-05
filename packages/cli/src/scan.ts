import { access, readFile } from "node:fs/promises"
import { isAbsolute, join, resolve } from "node:path"
import type { SchemaAdapter } from "@erdflow/core"
import { dbmlAdapter, findFilesByExtension } from "@erdflow/parser-dbml"
import {
  detectPrismaProject,
  prismaAdapter,
  resolvePrismaSchemaLocation,
  resolvePrismaSchemaLocationFromPath,
  type PrismaSchemaLocation,
} from "@erdflow/parser-prisma"
import { findSqlFiles, inferSqlDialect, sqlAdapter } from "@erdflow/parser-sql"

export type AdapterName = "prisma" | "dbml" | "sql"

export interface ScanFlags {
  prisma?: string
  dbml?: string
}

export interface ResolvedSource {
  adapter: SchemaAdapter
  adapterName: AdapterName
  filePath: string
  watchPaths: string[]
  /** Absolute `.prisma` paths to concatenate when loading (Prisma multi-file). */
  schemaFiles?: string[]
  dialect?: "postgresql" | "mysql" | "sqlite"
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function resolvePath(rootDir: string, inputPath: string): string {
  return isAbsolute(inputPath) ? inputPath : resolve(rootDir, inputPath)
}

function sourceFromPrismaLocation(
  location: PrismaSchemaLocation
): ResolvedSource {
  const watchPaths = [...location.files]
  if (location.configPath) {
    watchPaths.push(location.configPath)
  }

  return {
    adapter: prismaAdapter,
    adapterName: "prisma",
    filePath: location.rootPath,
    schemaFiles: location.files,
    watchPaths,
  }
}

async function resolveExplicitPrisma(
  rootDir: string,
  prismaPath: string
): Promise<ResolvedSource> {
  const location = await resolvePrismaSchemaLocationFromPath(rootDir, prismaPath)
  if (!location) {
    const filePath = resolvePath(rootDir, prismaPath)
    throw new Error(`Prisma schema file not found: ${filePath}`)
  }

  return sourceFromPrismaLocation(location)
}

async function resolveExplicitDbml(
  rootDir: string,
  dbmlPath: string
): Promise<ResolvedSource> {
  const filePath = resolvePath(rootDir, dbmlPath)
  if (!(await fileExists(filePath))) {
    throw new Error(`DBML schema file not found: ${filePath}`)
  }

  return {
    adapter: dbmlAdapter,
    adapterName: "dbml",
    filePath,
    watchPaths: [filePath],
  }
}

async function autoDetectPrisma(
  rootDir: string
): Promise<ResolvedSource | null> {
  if (!(await detectPrismaProject(rootDir))) {
    return null
  }

  const location = await resolvePrismaSchemaLocation(rootDir)
  if (!location) {
    return null
  }

  return sourceFromPrismaLocation(location)
}

async function autoDetectDbml(rootDir: string): Promise<ResolvedSource | null> {
  const files = await findFilesByExtension(rootDir, ".dbml")
  const filePath = files[0]
  if (!filePath) {
    return null
  }

  return {
    adapter: dbmlAdapter,
    adapterName: "dbml",
    filePath,
    watchPaths: [filePath],
  }
}

async function autoDetectSql(rootDir: string): Promise<ResolvedSource | null> {
  const files = await findSqlFiles(rootDir)
  const filePath = files[0]
  if (!filePath) {
    return null
  }

  const content = await readFile(filePath, "utf8")
  const dialect = inferSqlDialect(content)

  return {
    adapter: sqlAdapter,
    adapterName: "sql",
    filePath,
    watchPaths: [filePath],
    dialect,
  }
}

export async function resolveSchemaSource(
  rootDir: string,
  flags: ScanFlags = {}
): Promise<ResolvedSource> {
  if (flags.prisma) {
    return resolveExplicitPrisma(rootDir, flags.prisma)
  }

  if (flags.dbml) {
    return resolveExplicitDbml(rootDir, flags.dbml)
  }

  const detected =
    (await autoDetectPrisma(rootDir)) ??
    (await autoDetectDbml(rootDir)) ??
    (await autoDetectSql(rootDir))

  if (!detected) {
    throw new Error(
      "No schema source found. Supported formats: Prisma (prisma/schema.prisma), DBML (*.dbml), SQL (*.sql)."
    )
  }

  return detected
}

export async function readPackageJsonHints(rootDir: string): Promise<string[]> {
  try {
    const raw = await readFile(join(rootDir, "package.json"), "utf8")
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    const hints: string[] = []
    if (deps.prisma || deps["@prisma/client"]) {
      hints.push("Prisma")
    }
    if (deps["@dbml/core"]) {
      hints.push("DBML")
    }
    return hints
  } catch {
    return []
  }
}
