import { access, readdir } from "node:fs/promises";
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

export async function findFilesByExtension(
  rootDir: string,
  extension: string,
  maxDepth = MAX_DEPTH,
): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > maxDepth) {
      return;
    }

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }

      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(extension)) {
        results.push(fullPath);
      }
    }
  }

  await walk(rootDir, 0);
  return results;
}

export { exists };
