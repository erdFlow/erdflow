# Publishing erdFlow to npm

How to publish erdFlow packages to the [npm registry](https://www.npmjs.com/) so users can run `npx erdflow` or install `@erdflow/web` as a React library.

---

## Step-by-step: first publish to your `@erdflow` org

You already created the **erdflow** npm organization and are logged in as its owner. Follow these steps to ship the CLI first (fastest path — it bundles parsers + UI into one package).

### Step 1 — Confirm login

```bash
npm whoami
# should print: abhimanyujangid (or your npm username)
```

If not logged in:

```bash
npm login
```

### Step 2 — Pick the npm package name

| Name | Install command | Notes |
| --- | --- | --- |
| `erdflow` (unscoped) | `npx erdflow` | Best UX; matches README. Name is **available**. |
| `@erdflow/cli` (scoped) | `npx @erdflow/cli` | Lives under your org; needs `--access public`. |

For `npx erdflow`, use the unscoped name `erdflow` in `packages/cli/package.json`.

Check availability:

```bash
npm view erdflow          # 404 = available
npm view @erdflow/cli     # 404 = available
```

### Step 3 — Edit `packages/cli/package.json`

Make these changes (example for unscoped `erdflow` v0.1.0):

```json
{
  "name": "erdflow",
  "version": "0.1.0",
  "description": "Local-first database schema IDE — detect Prisma/DBML/SQL and open an interactive ERD",
  "license": "MIT",
  "author": "abhimanyujangid",
  "keywords": ["erd", "database", "schema", "prisma", "dbml", "sql"],
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/erdFlow.git"
  },
  "bin": {
    "erdflow": "./dist/cli.js"
  },
  "files": [
    "dist"
  ]
}
```

**Remove** the line `"private": true`.

The `"files": ["dist"]` field is important — without it npm ships `src/`, fixtures, and `.turbo` logs (~80 MB extra).

Keep `workspace:*` dependencies as-is for now; tsup bundles `@erdflow/*` into `dist/cli.js` at build time, so they are not needed at install time.

### Step 4 — Add a LICENSE file (repo root)

Create `erdFlow/LICENSE` with MIT text (or your chosen license). npm expects `"license": "MIT"` in `package.json` to match.

### Step 5 — Build

```bash
cd erdFlow
pnpm install
pnpm --filter @erdflow/cli build
```

Verify the CLI runs:

```bash
node packages/cli/dist/cli.js --no-open --prisma packages/parser-prisma/fixtures/basic.prisma
# → http://127.0.0.1:4317/
```

### Step 6 — Dry-run (inspect tarball)

```bash
cd packages/cli
npm pack --dry-run
```

Confirm only `dist/` is listed (not `src/`, `fixtures/`, `.turbo/`).

Optional: create the tarball locally and inspect:

```bash
npm pack
tar -tzf erdflow-0.1.0.tgz | head
```

### Step 7 — Publish

**Unscoped** (`erdflow`):

```bash
cd packages/cli
npm publish
```

**Scoped** (`@erdflow/cli`):

```bash
cd packages/cli
npm publish --access public
```

`--access public` is required for scoped packages — otherwise npm treats them as private (paid).

### Step 8 — Verify on npm

Open:

- https://www.npmjs.com/package/erdflow  
- or https://www.npmjs.com/package/@erdflow/cli  

Test install in a temp folder:

```bash
cd /tmp
npx erdflow --help
# or: npx @erdflow/cli --help
```

### Step 9 — Tag the release in git (recommended)

```bash
cd erdFlow
git tag v0.1.0
git push origin v0.1.0
```

### Step 10 — Later packages (optional)

After the CLI works, publish library packages in order if you want embeddable APIs:

1. `@erdflow/core`
2. `@erdflow/parser-*`, `@erdflow/layout`
3. `@erdflow/web`

Those need compiled `dist/` output and semver deps instead of `workspace:*` — see sections below.

---

## What you can publish

erdFlow is a **pnpm monorepo**. You can publish one or more packages:

| Package | npm name (suggested) | Use case |
| --- | --- | --- |
| CLI | `erdflow` or `@erdflow/cli` | `npx erdflow` — detect schema, serve ERD in browser |
| Visualizer | `@erdflow/web` | Embed `<ErdflowVisualizer />` in your own React app |
| Core / parsers / layout | `@erdflow/core`, `@erdflow/parser-prisma`, … | Lower-level building blocks |

**Today:** every package has `"private": true` and exports **TypeScript source** (`./src/index.ts`). That works inside the monorepo but is **not ready for npm** until you build compiled output and remove `private`.

---

## Prerequisites

### 1. npm account and org (if scoped)

1. Create an account at [npmjs.com/signup](https://www.npmjs.com/signup).
2. For scoped names like `@erdflow/cli`, create an org at [npmjs.com/org/create](https://www.npmjs.com/org/create) named `erdflow`, **or** publish under your personal scope (`@yourusername/erdflow`).
3. Log in locally:

```bash
npm login
# or: npm adduser
```

Verify:

```bash
npm whoami
```

### 2. Unique package name

Check availability before publishing:

```bash
npm view erdflow
npm view @erdflow/cli
```

If taken, pick another name or use a scoped package (`@yourorg/erdflow`).

### 3. Node and tooling (already in this repo)

- **Node.js** ≥ 20 (`engines` in root `package.json`)
- **pnpm** ≥ 10 (`packageManager` field)
- Build must succeed:

```bash
cd erdFlow
pnpm install
pnpm build
pnpm --filter @erdflow/cli build
```

### 4. Legal / metadata (required by npm)

Each published package needs in its `package.json`:

| Field | Example | Notes |
| --- | --- | --- |
| `name` | `"erdflow"` or `"@erdflow/cli"` | Must be unique on npm |
| `version` | `"0.1.0"` | [Semver](https://semver.org/) |
| `description` | Short one-liner | Shown on npm package page |
| `license` | `"MIT"` | Add `LICENSE` file at repo root |
| `repository` | GitHub URL | Helps users find source |
| `keywords` | `["erd", "prisma", "dbml"]` | Discoverability |
| `author` | Your name / org | Optional but recommended |

Remove `"private": true` from packages you intend to publish.

---

## Changes required before first publish

### A. Build libraries to `dist/` (not raw `.ts`)

npm consumers expect JavaScript + type declarations. Today most packages only export source:

```json
"exports": {
  ".": "./src/index.ts"
}
```

For each publishable package, add a build step (e.g. **tsup** or **tsc**) and point exports at `dist`:

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist", "README.md"]
}
```

The `files` array controls what gets packed — avoid shipping `src/`, tests, and fixtures unless intentional.

### B. Replace `workspace:*` with real semver

Published packages cannot depend on `workspace:*`. Before publish, internal deps must use real versions:

```json
"dependencies": {
  "@erdflow/core": "^0.1.0"
}
```

Tools that automate this in monorepos:

- **[Changesets](https://github.com/changesets/changesets)** (recommended for versioning + changelogs)
- **pnpm publish** with [`pnpm publish -r`](https://pnpm.io/cli/publish) after version bumps

Publish order (dependency graph):

1. `@erdflow/core`
2. `@erdflow/parser-*`, `@erdflow/layout`
3. `@erdflow/web` (depends on core, layout, ui)
4. `@erdflow/cli` (bundles parsers + static UI via tsup)

### C. CLI package (`erdflow`)

The CLI is closest to publish-ready:

- Already builds with **tsup** → `packages/cli/dist/`
- Has `"bin": { "erdflow": "./dist/cli.js" }`
- Bundles `@erdflow/*` via `noExternal` in `tsup.config.ts`

Still needed:

1. Remove `"private": true`
2. Set a real `version` (not `0.0.0` if you want a public release)
3. Ensure `dist/public/` (Vite-built UI assets) is included — add to `"files"` or verify tsup/copy step runs in CI
4. Rename to unscoped `erdflow` if you want `npx erdflow` without scope (optional)

Dry-run pack locally:

```bash
cd packages/cli
pnpm build
npm pack --dry-run
# Creates erdflow-x.y.z.tgz — inspect contents
```

### D. React library (`@erdflow/web`)

To embed the visualizer:

1. Build `@erdflow/web` to ESM + `.d.ts`
2. Declare **peerDependencies**: `react`, `react-dom` (already present)
3. Document required CSS (Tailwind / `@workspace/ui` styles) in README
4. Consider renaming `@workspace/ui` → `@erdflow/ui` for a consistent public scope

### E. Rename `@workspace/ui` (optional but cleaner)

Internal name `@workspace/ui` is not ideal on npm. Rename to `@erdflow/ui` before publishing anything that depends on it.

---

## Publishing workflow

### Option 1 — Manual (good for first test)

```bash
# 1. Bump version in package.json (or use changesets)
# 2. Build everything
pnpm build
pnpm --filter @erdflow/cli build

# 3. Publish from each package directory (bottom-up order)
cd packages/core && npm publish --access public   # required for @scoped packages
cd packages/parser-prisma && npm publish --access public
# ... other parsers, layout, web ...
cd packages/cli && npm publish --access public   # or unscoped: npm publish
```

Scoped packages are **private by default** on npm; always use `--access public` for open-source libraries.

### Option 2 — pnpm recursive

After versions are set and `workspace:*` is resolved:

```bash
pnpm publish -r --access public --no-git-checks
```

Use `--dry-run` first. Omit `--no-git-checks` once you tag releases in git.

### Option 3 — Changesets + CI (recommended long-term)

1. `pnpm add -Dw @changesets/cli`
2. `pnpm changeset init`
3. Add a changeset per PR; on merge, version + publish via GitHub Action

---

## Pre-publish checklist

- [ ] npm account created; `npm whoami` works
- [ ] Package name available on npm
- [ ] `"private": true` removed from publishable packages
- [ ] `LICENSE` file added (e.g. MIT)
- [ ] Each package builds to `dist/` with types
- [ ] `files` / `.npmignore` exclude tests, fixtures, source maps (optional)
- [ ] Internal deps use semver, not `workspace:*`
- [ ] `npm pack` / `npm publish --dry-run` inspected
- [ ] README documents install + usage (`npx erdflow` or `npm i @erdflow/web`)
- [ ] CI runs `pnpm build` and tests before publish

---

## After publish

Users install the CLI:

```bash
npx erdflow
# or
npm install -g erdflow
erdflow --prisma ./prisma/schema.prisma
```

Users embed the visualizer (once `@erdflow/web` is published):

```bash
npm install @erdflow/web react react-dom
```

```tsx
import { ErdflowVisualizer } from "@erdflow/web";

export default function Page() {
  return <ErdflowVisualizer />;
}
```

(See package README for WebSocket/API setup — the visualizer expects the CLI server on port 4317 by default.)

---

## Versioning and updates

- Follow [semver](https://semver.org/): breaking changes → major, features → minor, fixes → patch
- Tag releases in git: `git tag v0.1.0 && git push origin v0.1.0`
- Republish with a **new version** only — npm does not allow overwriting an existing version (except unpublish within 72h, which is discouraged)

---

## Related docs

- [Local development](./local-development.md) — run CLI + Vite before testing a publish candidate
- [npm publish docs](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
- [pnpm publish](https://pnpm.io/cli/publish)
