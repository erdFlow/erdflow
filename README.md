# erdFlow

Local-first database schema IDE — `npx erdflow` detects your project, parses the schema, and opens an interactive ERD in the browser.

See [brd.md](./brd.md) for full product requirements.

## Quick start

From any project with a Prisma, DBML, or SQL schema:

```bash
npx erdflow
```

erdflow will:

1. Detect your schema file (Prisma → DBML → SQL)
2. Parse it into a Universal Schema
3. Start a local server at `http://127.0.0.1:4317`
4. Open the browser with an interactive ERD

Example terminal output:

```
✓ Detected DBML
✓ schema.dbml
✓ 12 entities · 2 enums · 11 relations · 3 indexes
→ http://127.0.0.1:4317/

Watching schema files for changes...
```

## Usage

### Auto-detect (default)

```bash
npx erdflow
```

Detection order: `prisma/schema.prisma` → `*.dbml` → `*.sql`

### Explicit schema path

```bash
npx erdflow --prisma ./prisma/schema.prisma
npx erdflow --dbml ./database/schema.dbml
```

### Options

| Flag | Description |
| --- | --- |
| `--port <number>` | Server port (default `4317`) |
| `--no-open` | Skip auto-opening the browser |
| `--no-watch` | Disable file watching |
| `--prisma <path>` | Use a specific Prisma schema file |
| `--dbml <path>` | Use a specific DBML file |

Examples:

```bash
npx erdflow --port 5000
npx erdflow --no-open --dbml ./docs/schema.dbml
npx erdflow --no-watch --prisma ./custom/schema.prisma
```

### Supported formats

| Format | Location | Notes |
| --- | --- | --- |
| Prisma | `prisma/schema.prisma` | Models, relations, enums, indexes |
| DBML | `*.dbml` | Tables, relationships, enums |
| SQL | `*.sql` | PostgreSQL, MySQL, SQLite |

### Live updates

With watch enabled (default), editing your schema file re-parses and pushes updates to the browser over WebSocket — no manual refresh needed.

When a parse error occurs during watch, the CLI prints the error and the browser shows an alert while keeping the last valid schema.

## Monorepo development

```bash
pnpm install
pnpm dev              # Vite dev shell at apps/web (see below)
pnpm typecheck
pnpm build
```

**Prisma docs:** [docs/development/prisma/README.md](./docs/development/prisma/README.md) — local UI, tests, fixtures, v6/v7 layouts.

### Visualizer dev (two terminals)

The Vite dev server proxies `/api` and `/ws` to the CLI server on port `4317`. **Both must be running** or the UI shows Disconnected.

**Terminal 1** — CLI with a schema (keep running):

```bash
pnpm --filter @erdflow/cli build
node packages/cli/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/basic.prisma
```

**Terminal 2** — hot-reload the visualizer UI:

```bash
pnpm --filter web dev
```

Open **http://localhost:5173**. Prisma local runbook: [docs/development/prisma/local-development.md](./docs/development/prisma/local-development.md). Full doc map: [docs/development/prisma/README.md](./docs/development/prisma/README.md).

Build the CLI and visualizer bundle for production-style serving:

```bash
pnpm --filter @erdflow/cli build   # builds apps/web → packages/cli/public/assets/
node packages/cli/dist/cli.js --no-open --dbml packages/parser-dbml/fixtures/basic.dbml
```

Run tests:

```bash
pnpm --filter @erdflow/cli test
pnpm --filter @erdflow/layout test
pnpm --filter @erdflow/web typecheck
```

### Large schema smoke test (100 tables)

A 100-table DBML fixture lives at `packages/cli/fixtures/large.dbml`. Automated tests verify parse + ELK layout complete within 15 seconds:

```bash
pnpm --filter @erdflow/cli test
```

Manual check:

```bash
pnpm --filter @erdflow/cli build
node packages/cli/dist/cli.js --no-open --dbml packages/cli/fixtures/large.dbml
```

Open `http://127.0.0.1:4317` and confirm the diagram loads, pans, zooms, and searches without blocking the UI.

## Monorepo structure

```
apps/
  web/          # Dev UI shell (Vite + shadcn)
  docs/         # Documentation (stub)
docs/           # Developer guides (local dev, parsing tests)
packages/
  core/         # Universal Schema
  cli/          # CLI entry
  web/          # Visualizer UI
  layout/       # ELK.js layout
  ui/           # Shared shadcn components
  parser-*/     # Schema adapters (Prisma, DBML, SQL, …)
phases/         # BRD phase plans (see brd.md sections 45–48)
```

## Adding shadcn components

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Components land in `packages/ui/src/components`.

## Agent skills

Skills are locked in `skills-lock.json` and installed to `.agents/skills/`. Cursor reads them via symlinks in `.cursor/skills/`.

```bash
npx skills check    # update all locked skills
npx skills list     # show installed skills
```
