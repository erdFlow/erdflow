import { access, readFile } from "node:fs/promises"
import { join } from "node:path"

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function composerSuggestsLaravel(rootDir: string): Promise<boolean> {
  try {
    const raw = await readFile(join(rootDir, "composer.json"), "utf8")
    const pkg = JSON.parse(raw) as {
      require?: Record<string, string>
      "require-dev"?: Record<string, string>
    }
    const deps = { ...pkg.require, ...pkg["require-dev"] }
    return Boolean(
      deps["laravel/framework"] ||
        deps["illuminate/database"] ||
        deps["illuminate/support"]
    )
  } catch {
    return false
  }
}

/** True when the project looks like Laravel and has a migrations folder. */
export async function detectLaravelProject(rootDir: string): Promise<boolean> {
  const migrationsDir = join(rootDir, "database", "migrations")
  if (!(await exists(migrationsDir))) {
    return false
  }

  if (await exists(join(rootDir, "artisan"))) {
    return true
  }

  return composerSuggestsLaravel(rootDir)
}
