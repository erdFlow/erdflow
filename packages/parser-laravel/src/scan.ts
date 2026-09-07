import type { Dirent } from "node:fs"
import { access, readdir } from "node:fs/promises"
import { basename, join } from "node:path"

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/** Absolute paths to `database/migrations/*.php`, sorted by filename. */
export async function findMigrationFiles(rootDir: string): Promise<string[]> {
  const migrationsDir = join(rootDir, "database", "migrations")
  if (!(await exists(migrationsDir))) {
    return []
  }

  let entries: Dirent[]
  try {
    entries = await readdir(migrationsDir, { withFileTypes: true })
  } catch {
    return []
  }

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".php"))
    .map((entry) => join(migrationsDir, entry.name))
    .sort((a, b) => basename(a).localeCompare(basename(b)))
}

export { exists }
