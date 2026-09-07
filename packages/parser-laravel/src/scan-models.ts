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

async function walkPhpFiles(dir: string): Promise<string[]> {
  const results: string[] = []
  let entries: Dirent[]
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return results
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue
    }
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await walkPhpFiles(fullPath)))
      continue
    }
    if (entry.isFile() && entry.name.endsWith(".php")) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * Eloquent model PHP paths: `app/Models/**` plus legacy `app/User.php` if present.
 */
export async function findModelFiles(rootDir: string): Promise<string[]> {
  const modelsDir = join(rootDir, "app", "Models")
  const files = await walkPhpFiles(modelsDir)

  const legacyUser = join(rootDir, "app", "User.php")
  if (await exists(legacyUser)) {
    files.push(legacyUser)
  }

  return [...new Set(files)].sort((a, b) =>
    basename(a).localeCompare(basename(b))
  )
}
