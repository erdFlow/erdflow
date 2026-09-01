import { findFilesByExtension } from "./scan.js";

export async function detectDbmlProject(rootDir: string): Promise<boolean> {
  const files = await findFilesByExtension(rootDir, ".dbml");
  return files.length > 0;
}
