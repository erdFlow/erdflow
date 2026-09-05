# Prisma v6 / v7 layouts

How `@erdflow/parser-prisma` finds and loads schemas for both ORM generations.

## Resolution order

First match wins:

1. Explicit `--prisma <path>` (file **or** directory)
2. `prisma.config.ts` / `.js` / `.mjs` → static string `schema:` (file is not executed)
3. `package.json` → `prisma.schema`
4. `prisma/schema.prisma`
5. `prisma/schema/**/*.prisma`
6. `schema.prisma` at project root

## Behavior notes

| Topic | Behavior |
| --- | --- |
| Multi-file | All `.prisma` under the resolved root are concatenated, then passed to `getDMMF` |
| Watch | CLI watches every fragment file (+ config file when used) |
| Datasource without `url` (v7) | Stub `url = env("DATABASE_URL")` injected for DMMF only |
| Generator `prisma-client` vs `prisma-client-js` | Ignored for ERD; models/enums/relations drive the graph |

## Code

| Module | Role |
| --- | --- |
| `src/detect.ts` | `resolvePrismaSchemaLocation`, config path extract |
| `src/load.ts` | `loadPrismaDatamodel` |
| `src/parse.ts` | `normalizeDatamodelForDmmf`, `parsePrismaSchema` |

Fixtures: [fixtures.md](./fixtures.md). Local try-out: [local-development.md](./local-development.md).
