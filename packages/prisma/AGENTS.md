# AGENTS.md — @erdflow/prisma

Instructions for AI coding agents helping a user visualize a **Prisma** schema with `@erdflow/prisma`.

Opens a local interactive ERD at `http://127.0.0.1:4317/`. No cloud account; schema files stay on disk.

## Do this first

1. Confirm Node.js ≥ 20.
2. Find the package that owns the Prisma schema (`schema.prisma`, `prisma/schema/`, or `prisma.config.ts`).
3. Run from that directory:

```bash
npx @erdflow/prisma
```

4. If auto-detect fails or picks the wrong file (common in monorepos), pass `--prisma` explicitly.

## Commands

```bash
# Auto-detect prisma/schema.prisma, multi-file folder, or prisma.config.ts
npx @erdflow/prisma

# Single schema file
npx @erdflow/prisma --prisma ./prisma/schema.prisma

# Multi-file schema directory (Prisma v7 style)
npx @erdflow/prisma --prisma ./prisma/schema

# Nested monorepo package
npx @erdflow/prisma --prisma ./backend/prisma/schema.prisma

# Options
npx @erdflow/prisma --prisma ./prisma/schema.prisma --port 5000
npx @erdflow/prisma --prisma ./prisma/schema.prisma --no-open
npx @erdflow/prisma --prisma ./prisma/schema.prisma --no-watch
```

After global install, the binary is `erdflow-prisma`.

## Prisma layouts

| Layout | How to run |
| --- | --- |
| Classic `prisma/schema.prisma` | `npx @erdflow/prisma` from project root |
| v7 url-less datasource | Same; `url` may live in `prisma.config.ts` |
| Multi-file `prisma/schema/*.prisma` | `npx @erdflow/prisma --prisma ./prisma/schema` |
| Custom path via `prisma.config.ts` | Run from that project root, or `--prisma` to the file |

## Providers

Reads `datasource.provider`:

- **postgresql / mysql / sqlite / cockroachdb / sqlserver** → relational ERD + **SQL View**
- **mongodb** → collections + **Document View** (not SQL `CREATE TABLE`)

## Monorepo pitfall

Do **not** run from a parent folder that only has `prisma/migrations/**/*.sql`. Prefer:

```bash
cd path/to/package-with-schema
npx @erdflow/prisma --prisma ./prisma/schema.prisma
```

## Success output

```text
✓ Detected Prisma
✓ …/schema.prisma
✓ N entities · … enums · … relations · …
→ http://127.0.0.1:4317/
Watching schema files for changes...
```

Leave the process running so schema edits re-parse live.

## What not to do

- Do not invent `DATABASE_URL` for the diagram — only `.prisma` files are required.
- Do not point `--prisma` at a migration `.sql` file.
- Do not confuse this package with a future `@erdflow/laravel` (or other domain) package.

## Package docs

- `README.md` — overview + screenshots
- `llms.txt` — short command index
- `media/prisma-erd.png`, `media/prisma-focus.png` — UI previews
