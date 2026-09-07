# @erdflow/laravel

Interactive ERD from **Laravel migrations** — local-first, opens in your browser.

Part of the erdFlow family. Prisma ships separately as [`@erdflow/prisma`](https://www.npmjs.com/package/@erdflow/prisma).

```bash
npx @erdflow/laravel
```

## What it does

1. **Detects** a Laravel app (`artisan` or `composer.json` + `database/migrations`)
2. **Parses** Blueprint migrations for tables/columns, then Eloquent models for relations
3. **Starts** a local server at `http://127.0.0.1:4317`
4. **Opens** an interactive entity-relationship diagram

## Quick start

From the Laravel project root:

```bash
npx @erdflow/laravel
```

Or from elsewhere:

```bash
npx @erdflow/laravel --root /path/to/laravel-app
```

### Options

| Flag | Description |
| --- | --- |
| `--root <path>` | Laravel project root (default: cwd) |
| `--port <number>` | Server port (default `4317`) |
| `--no-open` | Do not open the browser |
| `--no-watch` | Disable live re-parse |

```bash
npx @erdflow/laravel --root ./backend --port 5000 --no-open
```

## Live updates

With watch enabled (default), editing `database/migrations/*.php` or `app/Models/**/*.php` re-parses and updates the browser over WebSocket.

## For AI agents

See [AGENTS.md](./AGENTS.md) and [llms.txt](./llms.txt) in this package.

## Source of truth

Migrations define **tables and columns**. Eloquent models enrich **relations** (`belongsTo` / `hasOne` / `hasMany` / `belongsToMany`). Prefer FK columns via `foreignId()->constrained()` when possible; soft FKs still appear when models declare them. Morphs are not supported yet.
