import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const MAX_DEPTH = 4;

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function findPrismaFiles(dir: string, depth: number): Promise<string[]> {
  if (depth > MAX_DEPTH) {
    return [];
  }

  const results: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") {
      continue;
    }

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findPrismaFiles(fullPath, depth + 1)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".prisma")) {
      results.push(fullPath);
    }
  }

  return results;
}

async function readPackageJson(rootDir: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(join(rootDir, "package.json"), "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function detectPrismaProject(rootDir: string): Promise<boolean> {
  if (await exists(join(rootDir, "prisma", "schema.prisma"))) {
    return true;
  }

  const schemaDir = join(rootDir, "prisma", "schema");
  if (await exists(schemaDir)) {
    const files = await findPrismaFiles(schemaDir, 0);
    if (files.length > 0) {
      return true;
    }
  }

  const pkg = await readPackageJson(rootDir);
  const prismaConfig = pkg?.prisma as { schema?: string } | undefined;
  if (prismaConfig?.schema) {
    const schemaPath = join(rootDir, prismaConfig.schema);
    if (await exists(schemaPath)) {
      return true;
    }
  }

  return false;
}

export async function resolvePrismaSchemaPath(rootDir: string): Promise<string | null> {
  const defaultPath = join(rootDir, "prisma", "schema.prisma");
  if (await exists(defaultPath)) {
    return defaultPath;
  }

  const pkg = await readPackageJson(rootDir);
  const prismaConfig = pkg?.prisma as { schema?: string } | undefined;
  if (prismaConfig?.schema) {
    const schemaPath = join(rootDir, prismaConfig.schema);
    if (await exists(schemaPath)) {
      return schemaPath;
    }
  }

  const schemaDir = join(rootDir, "prisma", "schema");
  const files = await findPrismaFiles(schemaDir, 0);
  return files[0] ?? null;
}
