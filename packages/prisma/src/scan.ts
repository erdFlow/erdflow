import { readFile } from "node:fs/promises"
import { isAbsolute, join, resolve } from "node:path"
import type { SchemaAdapter } from "@erdflow/core"
import {
  detectPrismaProject,
  type PrismaSchemaLocation,
  prismaAdapter,
  resolvePrismaSchemaLocation,
  resolvePrismaSchemaLocationFromPath,
} from "@erdflow/parser-prisma"

export type AdapterName = "prisma"

export interface ScanFlags {
  prisma?: string
}

export interface ResolvedSource {
  adapter: SchemaAdapter
  adapterName: AdapterName
  filePath: string
  watchPaths: string[]
  /** Absolute `.prisma` paths to concatenate when loading (Prisma multi-file). */
  schemaFiles?: string[]
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
  const location = await resolvePrismaSchemaLocationFromPath(
    rootDir,
    prismaPath
  )
  if (!location) {
    const filePath = resolvePath(rootDir, prismaPath)
    throw new Error(`Prisma schema file not found: ${filePath}`)
  }

  return sourceFromPrismaLocation(location)
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

export async function resolveSchemaSource(
  rootDir: string,
  flags: ScanFlags = {}
): Promise<ResolvedSource> {
  if (flags.prisma) {
    return resolveExplicitPrisma(rootDir, flags.prisma)
  }

  const detected = await autoDetectPrisma(rootDir)

  if (!detected) {
    throw new Error(
      "No schema source found. Expected Prisma (prisma/schema.prisma, multi-file folder, or prisma.config.ts)."
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
    return hints
  } catch {
    return []
  }
}
