import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { cwd } from "node:process"
import { fileURLToPath } from "node:url"
import type { UniversalSchema } from "@erdflow/core"
import { loadPrismaDatamodel } from "@erdflow/parser-prisma"
import { Command } from "commander"
import open from "open"
import {
  printCliError,
  printDetectionSummary,
  printParseError,
  printSchemaUpdated,
  printWatchEnabled,
} from "./output.js"
import {
  type ResolvedSource,
  readPackageJsonHints,
  resolveSchemaSource,
} from "./scan.js"
import { createServer } from "./server.js"
import { watchSchemaSource } from "./watch.js"

export interface CliOptions {
  port: string
  open: boolean
  watch: boolean
  prisma?: string
}

export interface SessionOptions {
  rootDir: string
  port: number
  watch: boolean
  prisma?: string
  /** Override static asset root (tests). Defaults next to this module's `public/`. */
  publicDir?: string
  printSummary?: boolean
}

export interface ErdflowSession {
  url: string
  schema: UniversalSchema
  close(): Promise<void>
}

function resolvePublicDir(moduleUrl: string): string {
  const currentDir = dirname(fileURLToPath(moduleUrl))
  return join(currentDir, "public")
}

async function openBrowser(url: string): Promise<void> {
  try {
    await open(url)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`Could not open browser: ${message}`)
    console.warn(`Open manually: ${url}`)
  }
}

export async function loadSchema(
  source: ResolvedSource
): Promise<UniversalSchema> {
  const content =
    source.adapterName === "prisma" && source.schemaFiles?.length
      ? await loadPrismaDatamodel(source.schemaFiles)
      : await readFile(source.filePath, "utf8")

  return source.adapter.parse(content, {
    filePath: source.filePath,
  })
}

export async function startSession(
  options: SessionOptions
): Promise<ErdflowSession> {
  const source = await resolveSchemaSource(options.rootDir, {
    prisma: options.prisma,
  })
  const packageHints = await readPackageJsonHints(options.rootDir)

  let schema: UniversalSchema
  try {
    schema = await loadSchema(source)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (options.printSummary !== false) {
      printParseError(source.filePath, message)
    }
    throw Object.assign(new Error(message), { erdflowPrinted: true as const })
  }

  const publicDir = options.publicDir ?? resolvePublicDir(import.meta.url)
  const server = await createServer({ port: options.port, publicDir })

  server.broadcastSchema(schema)
  if (options.printSummary !== false) {
    printDetectionSummary(
      options.rootDir,
      source,
      schema,
      server.url,
      packageHints
    )
  }

  let watcher: { close: () => Promise<void> } | undefined
  if (options.watch) {
    if (options.printSummary !== false) {
      printWatchEnabled()
    }
    watcher = watchSchemaSource(source.watchPaths, async () => {
      try {
        const updatedSchema = await loadSchema(source)
        server.broadcastSchema(updatedSchema)
        printSchemaUpdated(updatedSchema)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        printParseError(source.filePath, message)
        server.broadcastError(message)
      }
    })
  }

  return {
    url: server.url,
    schema,
    async close() {
      await watcher?.close()
      await server.close()
    },
  }
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command()

  program
    .name("erdflow-prisma")
    .description("Open an interactive ERD from a Prisma schema (local-first).")
    .version("0.1.0")
    .option("--port <number>", "Port for the local server", "4317")
    .option("--no-open", "Do not open the browser automatically")
    .option("--watch", "Watch schema files for changes", true)
    .option("--no-watch", "Disable file watching")
    .option("--prisma <path>", "Prisma schema file or multi-file folder")
    .action(async (options: CliOptions) => {
      try {
        const port = Number(options.port)
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error(`Invalid port: ${options.port}`)
        }

        const session = await startSession({
          rootDir: cwd(),
          port,
          watch: options.watch !== false,
          prisma: options.prisma,
        })

        if (options.open !== false) {
          await openBrowser(session.url)
        }

        const shutdown = async () => {
          console.log("\nShutting down...")
          await session.close()
          process.exit(0)
        }

        process.on("SIGINT", () => {
          void shutdown()
        })
        process.on("SIGTERM", () => {
          void shutdown()
        })

        await new Promise<void>(() => {
          // Keep process alive while server is running.
        })
      } catch (error) {
        if (
          !(
            error &&
            typeof error === "object" &&
            "erdflowPrinted" in error &&
            (error as { erdflowPrinted?: boolean }).erdflowPrinted
          )
        ) {
          printCliError(error)
        }
        process.exit(1)
      }
    })

  await program.parseAsync(argv)
}
