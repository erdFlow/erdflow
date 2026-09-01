import { Command } from "commander";

export interface CliOptions {
  port: string;
  open: boolean;
  watch: boolean;
  prisma?: string;
  dbml?: string;
}

export function runCli(argv: string[] = process.argv): void {
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
    .action((options: CliOptions) => {
      const stubOptions = [
        options.prisma ? `--prisma ${options.prisma}` : null,
        options.dbml ? `--dbml ${options.dbml}` : null,
        `--port ${options.port}`,
        options.open === false ? "--no-open" : null,
        options.watch === false ? "--no-watch" : null,
      ].filter(Boolean);

      console.log("erdflow is not fully implemented yet.");
      console.log("");
      console.log("Coming soon:");
      console.log("  detect schema -> parse -> serve localhost -> open browser");
      console.log("");
      if (stubOptions.length > 0) {
        console.log("Parsed options:", stubOptions.join(" "));
      } else {
        console.log("Run with --help to see available flags.");
      }
    });

  program.parse(argv);
}
