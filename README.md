# erdFlow

Local-first database schema IDE — `npx erdflow` detects your project, parses the schema, and opens an interactive ERD in the browser.

See [brd.md](./brd.md) for full product requirements.

## Monorepo structure

```
apps/
  web/          # Dev UI shell (Vite + shadcn)
  docs/         # Documentation (stub)
packages/
  core/         # Universal Schema
  cli/          # CLI entry
  web/          # Visualizer UI
  layout/       # ELK.js layout
  ui/           # Shared shadcn components
  parser-*/     # Schema adapters (Prisma, DBML, SQL, …)
phases/         # BRD phase plans (see brd.md sections 45–48)
```

## Development

```bash
pnpm install
pnpm dev        # starts apps/web
pnpm typecheck
pnpm build
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
npx skills list   # show installed skills
```
