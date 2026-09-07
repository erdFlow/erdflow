# Publishing erdFlow domain packages to npm

Ship **one npm package per domain**. Do not publish a universal “does everything” CLI or expose `@erdflow/core` to end users.

| Publish | Do not publish (monorepo private) |
| --- | --- |
| `@erdflow/prisma` | `@erdflow/core`, `@erdflow/layout`, `@erdflow/web`, `parser-*` |
| `@erdflow/laravel` (later) | Same internals |

Users run:

```bash
npx @erdflow/prisma
```

Agents read `AGENTS.md` / `llms.txt` inside that package after install — not a universal erdflow guide.

---

## Domain package template

Each published domain owns its own agent docs. Folder name = domain = npm scope.

```text
packages/<domain>/     →  @erdflow/<domain>
  README.md
  AGENTS.md
  llms.txt
  media/
  bin: erdflow-<domain>
```

When adding `@erdflow/laravel` (or any domain), **copy this checklist** — do **not** append Laravel sections to Prisma’s `AGENTS.md`:

1. Create `packages/<domain>/` with bin `erdflow-<domain>`
2. Own `README.md`, `AGENTS.md`, `llms.txt`, `media/`
3. Wire that domain’s parser; reuse private `core` / `layout` / `web` via the domain bundle
4. Set `repository.directory` to `packages/<domain>`
5. Publish `@erdflow/<domain>` with `--access public`

Shared internals stay private until two published packages need `@erdflow/core` on npm (two-adapters rule).

**Deep module rule:** the interface of `@erdflow/prisma` is “run Prisma ERD.” Laravel is a second adapter package with the same *shape*, not extra sections inside Prisma’s docs.

---

## Publish `@erdflow/prisma`

### 1. Login

```bash
npm whoami
# must be a member of the erdflow org
npm login   # if needed
```

### 2. Package identity

Configured in [`packages/prisma/package.json`](../packages/prisma/package.json):

| Field | Value |
| --- | --- |
| Path | `packages/prisma/` |
| `name` | `@erdflow/prisma` |
| `bin` | `erdflow-prisma` → `./dist/cli.js` |
| `publishConfig.access` | `public` |
| `files` | `dist/cli.js`, `dist/public`, `media`, `README.md`, `AGENTS.md`, `llms.txt` |
| `repository.directory` | `packages/prisma` |

Shared workspace packages stay `private` / unpublished. tsup bundles them into `dist/cli.js`.

### 3. Build

```bash
cd erdFlow
pnpm install
pnpm --filter @erdflow/core build
pnpm --filter @erdflow/prisma build
```

Smoke test:

```bash
node packages/prisma/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/basic.prisma
# → http://127.0.0.1:4317/
```

### 4. Dry-run

```bash
cd packages/prisma
npm pack --dry-run
```

Confirm the tarball includes README, AGENTS.md, llms.txt, media, and dist — not `src/`, fixtures, or `.turbo/`.

### 5. Publish

```bash
cd packages/prisma
npm publish --access public
```

Bump `version` in `package.json` for later releases (`0.1.1`, …).

### 6. Verify

```bash
npx @erdflow/prisma --help
npm view @erdflow/prisma
```

---

## Checklist before publish

- [ ] Package folder is `packages/<domain>/` (matches npm name)
- [ ] Package name is domain-scoped (`@erdflow/prisma`, not unscoped `erdflow`)
- [ ] Description and keywords are domain-only
- [ ] Own `README.md` / `AGENTS.md` / `llms.txt` / `media/` (not shared with other domains)
- [ ] Agent docs use `npx @erdflow/<domain>`
- [ ] `pnpm --filter @erdflow/<domain> build` succeeds
- [ ] `npm pack --dry-run` looks clean
- [ ] `@erdflow/core` (and other internals) remain unpublished
