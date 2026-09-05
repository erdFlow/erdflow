# Local development (Prisma)

Run erdFlow locally against **any Prisma schema** (fixtures or your project) with live UI.

## Two processes

| Process | Port | Role |
| --- | --- | --- |
| CLI server | `4317` | Detect / parse Prisma, `/api/schema`, `/ws`, file watch |
| Vite UI | `5173` | Visualizer; proxies API + WebSocket to the CLI |

Vite alone shows **Disconnected** until the CLI is running.

---

## Setup

```bash
cd erdFlow
pnpm install
pnpm --filter @erdflow/core build
pnpm --filter erdflow build    # rebuild after parser-prisma changes
# faster CLI-only rebuild (skips web):
# cd packages/cli && pnpm exec tsup && cp -R public dist/public
```

---

## Terminal 1 — CLI with Prisma

Use a real path (no placeholders).

### Built-in fixtures (try all layouts)

```bash
# Classic single file
node packages/cli/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/basic.prisma

# v6-style
node packages/cli/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/v6-classic/schema.prisma

# v7 url-less datasource
node packages/cli/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/v7-url-less/schema.prisma

# v7 multi-file folder
node packages/cli/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/v7-multifile/prisma/schema

# v7 custom path via config (run from that fixture root for auto-detect)
cd packages/parser-prisma/fixtures/v7-config-custom
node ../../../cli/dist/cli.js --no-open
# or from monorepo root:
# node packages/cli/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/v7-config-custom/db/schema.prisma
```

Full fixture list: [fixtures.md](./fixtures.md).

### Your own Prisma project

```bash
# Single schema file
node packages/cli/dist/cli.js --no-open --prisma /absolute/path/to/schema.prisma

# Multi-file schema directory
node packages/cli/dist/cli.js --no-open --prisma /absolute/path/to/prisma/schema

# Auto-detect from project root (schema.prisma, prisma/schema/, or prisma.config.ts)
cd /path/to/your/prisma-project
node /absolute/path/to/erdFlow/packages/cli/dist/cli.js --no-open
```

Expected CLI output:

```text
✓ Detected Prisma
✓ …/schema.prisma
✓ N entities · … enums · … relations · … indexes
→ http://127.0.0.1:4317/

Watching schema files for changes...
```

Leave this terminal running. `--no-open` skips opening a browser (use Vite instead).

---

## Terminal 2 — Vite UI

```bash
cd erdFlow
pnpm --filter web dev
```

Open **http://localhost:5173**.

- Edit React under `packages/web/` / `apps/web/` → hot reload.
- Edit watched `.prisma` files → CLI re-parses and pushes over WebSocket.

---

## Single-process (bundled UI, no Vite)

```bash
pnpm --filter erdflow build
node packages/cli/dist/cli.js --prisma packages/parser-prisma/fixtures/basic.prisma
```

Open **http://127.0.0.1:4317** (omit `--no-open` to auto-open).

---

## Useful CLI flags (Prisma)

| Flag | Meaning |
| --- | --- |
| `--prisma <path>` | Schema **file** or **directory** |
| `--no-open` | Don’t open browser (pair with Vite) |
| `--no-watch` | Disable live re-parse |
| `--port <n>` | Server port (default `4317`) |

Layouts / resolution: [layouts-v6-v7.md](./layouts-v6-v7.md). Problems: [troubleshooting.md](./troubleshooting.md).
