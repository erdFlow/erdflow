import { cwd } from "node:process";
import { Command } from "commander";
import { loadSchema } from "./parse-source.js";
import { openBrowser } from "./open-browser.js";
import {
  printCliError,
  printDetectionSummary,
  printParseError,
  printSchemaUpdated,
  printWatchEnabled,
} from "./output.js";
import { resolvePublicDir } from "./paths.js";
import { readPackageJsonHints, resolveSchemaSource } from "./scan.js";
import { createServer } from "./server.js";
import { watchSchemaSource } from "./watch.js";

export interface CliOptions {
  port: string;
  open: boolean;
  watch: boolean;
  prisma?: string;
  dbml?: string;
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  program
    .name("erdflow")
    .description("Detect schema files, serve a local ERD, and watch for changes.")
    .version("0.0.0")
    .option("--port <number>", "Port for the local server", "4317")
    .option("--no-open", "Do not open the browser automatically")
    .option("--watch", "Watch schema files for changes", true)
    .option("--no-watch", "Disable file watching")
    .option("--prisma <path>", "Explicit Prisma schema file path")
    .option("--dbml <path>", "Explicit DBML schema file path")
    .action(async (options: CliOptions) => {
      try {
        const rootDir = cwd();
        const port = Number(options.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error(`Invalid port: ${options.port}`);
        }

        const source = await resolveSchemaSource(rootDir, {
          prisma: options.prisma,
          dbml: options.dbml,
        });
        const packageHints = await readPackageJsonHints(rootDir);

        let schema;
        try {
          schema = await loadSchema(source);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          printParseError(source.filePath, message);
          process.exit(1);
        }

        const publicDir = resolvePublicDir(import.meta.url);
        const server = await createServer({ port, publicDir });

        server.broadcastSchema(schema);
        printDetectionSummary(rootDir, source, schema, server.url, packageHints);

        let watcher: { close: () => Promise<void> } | undefined;
        if (options.watch !== false) {
          printWatchEnabled();
          watcher = watchSchemaSource(source.watchPaths, async () => {
            try {
              const updatedSchema = await loadSchema(source);
              server.broadcastSchema(updatedSchema);
              printSchemaUpdated(updatedSchema);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : String(error);
              printParseError(source.filePath, message);
              server.broadcastError(message);
            }
          });
        }

        if (options.open !== false) {
          await openBrowser(server.url);
        }

        const shutdown = async () => {
          console.log("\nShutting down...");
          await watcher?.close();
          await server.close();
          process.exit(0);
        };

        process.on("SIGINT", () => {
          void shutdown();
        });
        process.on("SIGTERM", () => {
          void shutdown();
        });

        await new Promise<void>(() => {
          // Keep process alive while server is running.
        });
      } catch (error) {
        printCliError(error);
        process.exit(1);
      }
    });

  await program.parseAsync(argv);
}
