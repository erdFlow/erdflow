# Deploying erdFlow domain packages to npm

Ship **one npm package per domain**. Do not publish a universal “does everything” CLI or expose `@erdflow/core` to end users.

| Publish | Do not publish (monorepo private) |
| --- | --- |
| `@erdflow/<Domain>` | `@erdflow/core`, `@erdflow/layout`, `@erdflow/web`, `parser-*` |

Users run:

```bash
npx @erdflow/<Domain>
```

Agents read `AGENTS.md` / `llms.txt` inside that package after install — not a universal erdflow guide.

Replace `<Domain>` with the domain id (lowercase folder/npm segment), e.g. the package path `packages/<Domain>/` and name `@erdflow/<Domain>`.

---

## Domain package template

Each published domain owns its own agent docs. Folder name = domain = npm scope.

```text
packages/<Domain>/     →  @erdflow/<Domain>
  README.md
  AGENTS.md
  llms.txt
  media/
  bin: erdflow-<Domain>
```

When adding a new domain, **copy this checklist** — do **not** append that domain’s sections into another domain’s `AGENTS.md`:

1. Create `packages/<Domain>/` with bin `erdflow-<Domain>`
2. Own `README.md`, `AGENTS.md`, `llms.txt`, `media/`
3. Wire that domain’s parser; reuse private `core` / `layout` / `web` via the domain bundle
4. Set `repository.directory` to `packages/<Domain>`
5. Publish `@erdflow/<Domain>` with `--access public`

Shared internals stay private until two published packages need `@erdflow/core` on npm (two-adapters rule).

**Deep module rule:** the interface of `@erdflow/<Domain>` is “run ERD for that domain.” Each new domain is a second adapter package with the same *shape*, not extra sections inside another domain’s docs.

---

## Publish `@erdflow/<Domain>`

### 1. Login

```bash
npm whoami
# must be a member of the erdflow org
npm login   # if needed
```

### 2. Package identity

Configured in `packages/<Domain>/package.json`:

| Field | Value |
| --- | --- |
| Path | `packages/<Domain>/` |
| `name` | `@erdflow/<Domain>` |
| `bin` | `erdflow-<Domain>` → `./dist/cli.js` |
| `publishConfig.access` | `public` |
| `files` | `dist/cli.js`, `dist/public`, `media`, `README.md`, `AGENTS.md`, `llms.txt` |
| `repository.directory` | `packages/<Domain>` |

Shared workspace packages stay `private` / unpublished. tsup bundles them into `dist/cli.js`.

### 3. Build

```bash
cd erdFlow
pnpm install
pnpm --filter @erdflow/core build
pnpm --filter @erdflow/<Domain> build
```

Smoke test (adjust schema path for the domain):

```bash
node packages/<Domain>/dist/cli.js --no-open
# → http://127.0.0.1:4317/
```

### 4. Dry-run

```bash
cd packages/<Domain>
npm pack --dry-run
```

Confirm the tarball includes README, AGENTS.md, llms.txt, media, and dist — not `src/`, fixtures, or `.turbo/`.

### 5. Publish

```bash
cd packages/<Domain>
npm publish --access public
```

Bump `version` in `package.json` for later releases (`0.1.1`, …).

### 6. Verify

```bash
npx @erdflow/<Domain> --help
npm view @erdflow/<Domain>
```

---

## Checklist before publish

- [ ] Package folder is `packages/<Domain>/` (matches npm name)
- [ ] Package name is domain-scoped (`@erdflow/<Domain>`, not unscoped `erdflow`)
- [ ] Description and keywords are domain-only
- [ ] Own `README.md` / `AGENTS.md` / `llms.txt` / `media/` (not shared with other domains)
- [ ] Agent docs use `npx @erdflow/<Domain>`
- [ ] `pnpm --filter @erdflow/<Domain> build` succeeds
- [ ] `npm pack --dry-run` looks clean
- [ ] `@erdflow/core` (and other internals) remain unpublished
