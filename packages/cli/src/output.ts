import { relative } from "node:path";
import type { UniversalSchema } from "@erdflow/core";
import type { AdapterName, ResolvedSource } from "./scan.js";

function formatAdapterName(name: AdapterName): string {
  switch (name) {
    case "prisma":
      return "Prisma";
    case "dbml":
      return "DBML";
    case "sql":
      return "SQL";
  }
}

export function printDetectionSummary(
  rootDir: string,
  source: ResolvedSource,
  schema: UniversalSchema,
  url: string,
  packageHints: string[] = [],
): void {
  const relativePath = relative(rootDir, source.filePath) || source.filePath;
  const dialectSuffix = source.dialect ? ` (${source.dialect})` : "";

  console.log("");
  console.log(`✓ Detected ${formatAdapterName(source.adapterName)}${dialectSuffix}`);
  if (packageHints.length > 0) {
    console.log(`  package.json hints: ${packageHints.join(", ")}`);
  }
  console.log(`✓ ${relativePath}`);
  console.log(
    `✓ ${schema.entities.length} entities · ${schema.enums.length} enums · ${schema.relations.length} relations · ${schema.indexes.length} indexes`,
  );
  console.log(`→ ${url}`);
  console.log("");
}

export function printWatchEnabled(): void {
  console.log("Watching schema files for changes...");
}

export function printSchemaUpdated(schema: UniversalSchema): void {
  console.log(
    `Schema updated · ${schema.entities.length} entities · ${schema.enums.length} enums · ${schema.relations.length} relations`,
  );
}

export function printUnsupportedProject(message: string): void {
  console.error("");
  console.error("✗ No schema source found");
  console.error(`  ${message}`);
  console.error("");
  console.error("Supported formats:");
  console.error("  • Prisma   prisma/schema.prisma   (or --prisma <path>)");
  console.error("  • DBML     *.dbml                 (or --dbml <path>)");
  console.error("  • SQL      *.sql                  (PostgreSQL, MySQL, SQLite)");
  console.error("");
}

export function printParseError(filePath: string, message: string): void {
  console.error("");
  console.error("✗ Schema parse error");
  console.error(`  file: ${filePath}`);
  console.error(`  ${message}`);
  console.error("");
}

export function printCliError(error: unknown): void {
  if (error instanceof Error && error.message.startsWith("No schema source found")) {
    printUnsupportedProject(error.message);
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error("");
  console.error(`✗ ${message}`);
  console.error("");
}
