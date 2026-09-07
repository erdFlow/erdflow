# AGENTS.md — @erdflow/laravel

Instructions for AI coding agents helping a user visualize a **Laravel** schema with `@erdflow/laravel`.

Opens a local interactive ERD at `http://127.0.0.1:4317/`. No cloud account; migration files stay on disk.

## Do this first

1. Confirm Node.js ≥ 20.
2. Find the Laravel app root (`artisan`, `composer.json`, `database/migrations`).
3. Run from that directory:

```bash
npx @erdflow/laravel
```

4. If the shell is not in the Laravel root, pass `--root`:

```bash
npx @erdflow/laravel --root /absolute/path/to/laravel-app
```

## Commands

```bash
npx @erdflow/laravel
npx @erdflow/laravel --root ./backend
npx @erdflow/laravel --root ./backend --port 5000
npx @erdflow/laravel --root ./backend --no-open
npx @erdflow/laravel --root ./backend --no-watch
```

After install, the binary is `erdflow-laravel`.

## What is parsed

- `database/migrations/*.php` Blueprint API (`Schema::create` / `table` / `drop`) — **tables and columns**
- Applied in **filename order** so later alters accumulate
- `down()` methods are ignored
- `app/Models/**/*.php` Eloquent relations (`belongsTo`, `hasOne`, `hasMany`, `belongsToMany`) — **adds / names relations**; does not invent tables
- Soft FKs (column without `constrained()`) become edges when Eloquent declares them

Not parsed yet: morph relations, `hasManyThrough`, raw `DB::statement`, Query Builder.

Watch covers migrations and model files so either change reloads the ERD.

## Success output

```text
✓ Detected Laravel
✓ …/database/migrations
✓ N entities · … enums · … relations · …
→ http://127.0.0.1:4317/
Watching migrations and models for changes...
```

Leave the process running so migration or model edits re-parse live.

## What not to do

- Do not use `@erdflow/prisma` on a Laravel app.
- Do not run from a parent monorepo folder that is not the Laravel app unless `--root` points at the app.
- Do not expect query-builder PHP elsewhere in `app/` to define the ERD.
- Morph / polymorphic relations are not first-class edges yet.
