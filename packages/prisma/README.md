# @erdflow/prisma

Interactive ERD from a **Prisma** schema — local-first, opens in your browser.

Part of the erdFlow family. Other domains (Laravel, …) ship as separate packages later.

```bash
npx @erdflow/prisma
```

## Preview

![erdflow Prisma ERD canvas](./media/prisma-erd.png)

![Focused table and relationships](./media/prisma-focus.png)

## What it does

1. **Detects** your Prisma schema (`prisma/schema.prisma`, multi-file folder, or `prisma.config.ts`)
2. **Parses** models, relations, enums, and indexes
3. **Starts** a local server at `http://127.0.0.1:4317`
4. **Opens** an interactive entity-relationship diagram

Example output:

```
✓ Detected Prisma
✓ prisma/schema.prisma
✓ 12 entities · 2 enums · 11 relations · 3 indexes
→ http://127.0.0.1:4317/

Watching schema files for changes...
```

## Quick start

From the project (or monorepo package) that owns the Prisma schema:

```bash
npx @erdflow/prisma
```

Or install globally:

```bash
npm install -g @erdflow/prisma
erdflow-prisma
```

### Explicit path

```bash
npx @erdflow/prisma --prisma ./prisma/schema.prisma
npx @erdflow/prisma --prisma ./prisma/schema
npx @erdflow/prisma --prisma ./backend/prisma/schema.prisma
```

Supports Prisma **v6** and **v7** (url-less datasource, multi-file, `prisma.config.ts`).

Providers: **PostgreSQL**, **MySQL**, **SQLite**, **MongoDB** (Document View instead of SQL View), and other Prisma SQL providers.

## Options

| Flag | Description |
| --- | --- |
| `--prisma <path>` | Schema file or multi-file folder |
| `--port <number>` | Server port (default `4317`) |
| `--no-open` | Do not open the browser |
| `--no-watch` | Disable live re-parse |

```bash
npx @erdflow/prisma --prisma ./prisma/schema.prisma --port 5000
npx @erdflow/prisma --prisma ./prisma/schema.prisma --no-open
```

## Live updates

With watch enabled (default), editing `.prisma` files re-parses and updates the browser over WebSocket.

## For AI agents

This package ships Prisma-focused docs agents can read after install:

| File | Purpose |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | How to run against Prisma (v6/v7, multi-file, monorepos) |
| [`llms.txt`](./llms.txt) | Short command index |

## Requirements

- **Node.js ≥ 20**

## Links

- [GitHub](https://github.com/erdFlow/erdflow)
- [Issues](https://github.com/erdFlow/erdflow/issues)

## License

MIT © [erdFlow](https://github.com/erdFlow/erdflow)
