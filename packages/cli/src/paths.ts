import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function resolvePublicDir(moduleUrl: string): string {
  const currentDir = dirname(fileURLToPath(moduleUrl));
  return join(currentDir, "public");
}
