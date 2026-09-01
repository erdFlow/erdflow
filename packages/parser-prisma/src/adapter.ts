import type { ParseOptions, SchemaAdapter } from "@erdflow/core";
import { detectPrismaProject } from "./detect.js";
import { parsePrismaSchema } from "./parse.js";

export const prismaAdapter: SchemaAdapter = {
  name: "prisma",

  async detect(project) {
    return detectPrismaProject(project.rootDir);
  },

  async parse(input, options?: ParseOptions) {
    return parsePrismaSchema(input, {
      source: options?.filePath,
      adapter: "prisma",
    });
  },
};
