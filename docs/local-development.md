# Local development — parsing & visualizer testing

How to run erdFlow locally when working on **schema parsers**, the **CLI**, or the **browser UI**.

In development, erdFlow is **two processes**:

| Process | Port | What it does |
| --- | --- | --- |
| **CLI server** | `4317` | Detects schema files, parses them, serves `/api/schema` and `/ws` |
| **Vite dev UI** | `5173` | React visualizer with hot reload; proxies API/WebSocket to `4317` |

If you only start Vite, the footer shows **Disconnected** and the canvas says **Waiting for schema from the CLI server** — that is expected. You must run the CLI in a separate terminal.

---

## Prerequisites

```bash
cd erdFlow
pnpm install
```

Build the CLI once (or after CLI/parser changes):

```bash
pnpm --filter @erdflow/cli build
```

---

## Standard workflow (two terminals)

### Terminal 1 — CLI (schema parsing + API)

Pick a schema source. Use **`node packages/cli/dist/cli.js`** directly — do not use placeholder paths.

**Prisma (built-in fixture):**

```bash
node packages/cli/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/basic.prisma
```

**DBML (built-in fixture):**

```bash
node packages/cli/dist/cli.js --no-open --dbml packages/parser-dbml/fixtures/basic.dbml
```

**Your own Prisma project:**

```bash
node packages/cli/dist/cli.js --no-open --prisma /absolute/path/to/your/project/prisma/schema.prisma
```

**Auto-detect** (from current directory — run inside a project that has `prisma/schema.prisma`, `*.dbml`, or `*.sql`):

```bash
cd /path/to/your/project
node /Users/abhimanyu/Development/Database/erdFlow/packages/cli/dist/cli.js --no-open
```

Expected output:

```
✓ Detected Prisma
✓ packages/parser-prisma/fixtures/basic.prisma
✓ 5 entities · 1 enums · 4 relations · 2 indexes
→ http://127.0.0.1:4317/

Watching schema files for changes...
```

Leave this terminal **running**. `--no-open` prevents the CLI from opening a browser tab (you use Vite instead).

### Terminal 2 — Vite (UI hot reload)

```bash
cd erdFlow
pnpm --filter web dev
```

Open **http://localhost:5173**. The UI loads the schema from the CLI via proxy.

Edit React components under `packages/web/` or `apps/web/` — the page hot-reloads. Edit the schema file on disk — the CLI re-parses and pushes updates over WebSocket.

---

## Built-in test fixtures

Use these when testing parsers without an external project:

| Format | Fixture path |
| --- | --- |
| Prisma | `packages/parser-prisma/fixtures/basic.prisma` |
| DBML | `packages/parser-dbml/fixtures/basic.dbml` |
| Large DBML (100 tables) | `packages/cli/fixtures/large.dbml` |

Example — large schema smoke test:

```bash
node packages/cli/dist/cli.js --no-open --dbml packages/cli/fixtures/large.dbml
```

---

## Production-style UI (single process)

To test the bundled UI served by the CLI (no Vite), build and run:

```bash
pnpm --filter @erdflow/cli build
node packages/cli/dist/cli.js --prisma packages/parser-prisma/fixtures/basic.prisma
```

Open **http://127.0.0.1:4317** (CLI opens the browser by default; omit `--no-open`).

---

## Parser & CLI unit tests

Run without the browser when changing parsing logic:

```bash
# Core schema factory + validation
pnpm --filter @erdflow/core test

# All CLI tests (scan, parse, server, watch, large schema)
pnpm --filter erdflow test

# Prisma parser only (includes error + size ladder benches)
pnpm --filter @erdflow/parser-prisma test

# DBML parser only
pnpm --filter @erdflow/parser-dbml test

# Layout engine (includes S/M/L/XL performance + memory)
pnpm --filter @erdflow/layout test

# Visualizer types
pnpm --filter @erdflow/web typecheck
```

### Size ladder (Wave 1)

Shared fixtures from `@erdflow/core/testing` (`createSizedSchema`) drive layout and parser timing checks:

| Size | Models | Layout budget | Prisma parse budget |
| --- | --- | --- | --- |
| S | 5 | &lt; 500ms | &lt; 2s |
| M | 25 | &lt; 2s | &lt; 5s |
| L | 100 | &lt; 15s | &lt; 15s |
| XL | 200 | &lt; 30s (+ heap soft ceiling) | &lt; 30s |

Browser e2e (initial paint, drag, zoom FPS) is deferred to a later wave.

After parser changes, rebuild the CLI before manual UI testing:

```bash
pnpm --filter erdflow build
```

---

## CLI flags reference

| Flag | Description |
| --- | --- |
| `--no-open` | Do not open browser (use with Vite on `5173`) |
| `--prisma <path>` | Explicit Prisma schema file |
| `--dbml <path>` | Explicit DBML file |
| `--port <number>` | Server port (default `4317`) |
| `--no-watch` | Disable live re-parse on file changes |

---

## Troubleshooting

### Footer shows "Disconnected"

- The CLI is not running on port `4317`.
- Start Terminal 1 with one of the `node packages/cli/dist/cli.js` commands above.
- Confirm: `curl http://127.0.0.1:4317/api/schema` returns JSON.

### Vite logs `ECONNREFUSED 127.0.0.1:4317`

Same cause — CLI not started. Vite proxies `/api` and `/ws` to `4317`; nothing to connect to until the CLI runs.

### `error: too many arguments` when using `pnpm erdflow`

Avoid:

```bash
pnpm erdflow -- --no-open --prisma ...
```

The extra `--` can break argument parsing. Prefer:

```bash
node packages/cli/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/basic.prisma
```

### Used a placeholder path

`/path/to/your/project/prisma/schema.prisma` is documentation only. Replace it with a real absolute or relative path to your `schema.prisma`.

### `No package.json found`

Run commands from the **`erdFlow`** directory (monorepo root), not the parent `Database` folder.

### Schema changes not appearing in the UI

1. Confirm the CLI terminal shows `Watching schema files for changes...`
2. Save the schema file you passed to `--prisma` or `--dbml`
3. Check the CLI terminal for parse errors
4. Ensure footer status is **Connected**, not **Disconnected**

---

## Architecture (dev mode)

```
┌─────────────────────┐         proxy /api, /ws          ┌─────────────────────┐
│  Vite  :5173        │  ─────────────────────────────►│  CLI   :4317        │
│  apps/web           │                                  │  packages/cli       │
│  packages/web (UI)  │                                  │  parser-* → schema  │
└─────────────────────┘                                  └─────────────────────┘
        browser                                                  watches
     localhost:5173                                          schema file on disk
```

---

## Related docs

- [README.md](../README.md) — quick start and `npx erdflow` usage
- [brd.md](../brd.md) — product requirements
