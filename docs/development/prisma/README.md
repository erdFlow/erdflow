# Prisma development

Docs for `@erdflow/parser-prisma`: local CLI + UI, tests, fixtures, and v6/v7 layouts.

Package: [`packages/parser-prisma`](../../../packages/parser-prisma)

**Published CLI (npm `@erdflow/prisma`):** [`packages/prisma/AGENTS.md`](../../../packages/prisma/AGENTS.md) and [`packages/prisma/llms.txt`](../../../packages/prisma/llms.txt) ship inside the package.

---

## Doc map (tasks / features)

| Task / feature | Doc |
| --- | --- |
| Run local development (CLI + Vite UI) with Prisma | [local-development.md](./local-development.md) |
| Run all Prisma unit / error / size tests | [testing.md](./testing.md) |
| Fixture catalog (basic, v6/v7, invalid, relations, Mongo, ID strategies) | [fixtures.md](./fixtures.md) |
| v6 vs v7 file layouts & schema resolution | [layouts-v6-v7.md](./layouts-v6-v7.md) |
| Prisma troubleshooting | [troubleshooting.md](./troubleshooting.md) |

---

## Quick start

```bash
cd erdFlow
pnpm install
pnpm --filter @erdflow/core build
pnpm --filter @erdflow/prisma build
```

**Local UI (two terminals)** — details in [local-development.md](./local-development.md):

```bash
# Terminal 1
node packages/prisma/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/basic.prisma

# Terminal 2
pnpm --filter web dev
# → http://localhost:5173
```

**All Prisma parser tests** — details in [testing.md](./testing.md):

```bash
pnpm --filter @erdflow/parser-prisma test
```

---

## Package source map

| Path | Role |
| --- | --- |
| `src/detect.ts` | Project detect + schema location |
| `src/load.ts` | Multi-file datamodel load |
| `src/parse.ts` | DMMF → UniversalSchema |
| `src/adapter.ts` | `SchemaAdapter` entry |
