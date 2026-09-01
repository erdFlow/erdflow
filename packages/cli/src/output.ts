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

  console.log("");
  console.log(`✓ Detected ${formatAdapterName(source.adapterName)}`);
  if (packageHints.length > 0) {
    console.log(`  package.json hints: ${packageHints.join(", ")}`);
  }
  console.log(`✓ ${relativePath}`);
  console.log(
    `✓ ${schema.entities.length} entities · ${schema.enums.length} enums · ${schema.relations.length} relations`,
  );
  console.log(`→ ${url}`);
  console.log("");
}

export function printWatchEnabled(): void {
  console.log("Watching schema files for changes...");
}

export function printParseError(message: string): void {
  console.error(`Schema parse error: ${message}`);
}
