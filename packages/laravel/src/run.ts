import { dirname, join } from "node:path"
import { cwd } from "node:process"
import { fileURLToPath } from "node:url"
import type { UniversalSchema } from "@erdflow/core"
import {
  detectLaravelProject,
  findMigrationFiles,
  findModelFiles,
  loadLaravelSchema,
} from "@erdflow/parser-laravel"
import { Command } from "commander"
import open from "open"
import {
  printCliError,
  printDetectionSummary,
  printParseError,
  printSchemaUpdated,
  printUnsupportedProject,
  printWatchEnabled,
  resolveRootDir,
} from "./output.js"
import { createServer } from "./server.js"
import { watchSchemaSource } from "./watch.js"

export interface CliOptions {
  port: string
  open: boolean
  watch: boolean
  root?: string
}

export interface SessionOptions {
  rootDir: string
  port: number
  watch: boolean
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

export async function startSession(
  options: SessionOptions
): Promise<ErdflowSession> {
  const isLaravel = await detectLaravelProject(options.rootDir)
  if (!isLaravel) {
    const message =
      "No Laravel project found. Expected artisan or composer.json with laravel/framework, plus database/migrations."
    if (options.printSummary !== false) {
      printUnsupportedProject(message)
    }
    throw Object.assign(new Error(message), { erdflowPrinted: true as const })
  }

  const migrationsDir = join(options.rootDir, "database", "migrations")
  let schema: UniversalSchema
  try {
    schema = await loadLaravelSchema(options.rootDir)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (options.printSummary !== false) {
      printParseError(migrationsDir, message)
    }
    throw Object.assign(new Error(message), { erdflowPrinted: true as const })
  }

  const publicDir = options.publicDir ?? resolvePublicDir(import.meta.url)
  const server = await createServer({ port: options.port, publicDir })

  server.broadcastSchema(schema)
  if (options.printSummary !== false) {
    printDetectionSummary(options.rootDir, migrationsDir, schema, server.url)
  }

  let watcher: { close: () => Promise<void> } | undefined
  if (options.watch) {
    if (options.printSummary !== false) {
      printWatchEnabled()
    }
    const migrationFiles = await findMigrationFiles(options.rootDir)
    const modelFiles = await findModelFiles(options.rootDir)
    const modelsDir = join(options.rootDir, "app", "Models")
    const watchPaths =
      migrationFiles.length > 0 || modelFiles.length > 0
        ? [...migrationFiles, ...modelFiles]
        : [migrationsDir, modelsDir]

    watcher = watchSchemaSource(watchPaths, async () => {
      try {
        const updatedSchema = await loadLaravelSchema(options.rootDir)
        server.broadcastSchema(updatedSchema)
        printSchemaUpdated(updatedSchema)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        printParseError(migrationsDir, message)
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
    .name("erdflow-laravel")
    .description(
      "Open an interactive ERD from Laravel migrations (local-first)."
    )
    .version("0.1.0")
    .option("--port <number>", "Port for the local server", "4317")
    .option("--no-open", "Do not open the browser automatically")
    .option("--watch", "Watch migration files for changes", true)
    .option("--no-watch", "Disable file watching")
    .option("--root <path>", "Laravel project root (default: cwd)")
    .action(async (options: CliOptions) => {
      try {
        const port = Number(options.port)
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error(`Invalid port: ${options.port}`)
        }

        const session = await startSession({
          rootDir: resolveRootDir(cwd(), options.root),
          port,
          watch: options.watch !== false,
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
