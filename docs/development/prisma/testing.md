# Testing (Prisma)

How to run and interpret `@erdflow/parser-prisma` tests locally.

## Commands

```bash
cd erdFlow

# All Prisma parser tests (adapter, detect, errors, relations, performance)
pnpm --filter @erdflow/parser-prisma test

# Types
pnpm --filter @erdflow/parser-prisma typecheck

# CLI tests that hit Prisma detect / load / watch / errors
pnpm --filter erdflow test
```

After parser source changes, rebuild the CLI before manual UI checks:

```bash
pnpm --filter erdflow build
```

---

## Test map

| Area | Test file | Fixture / input |
| --- | --- | --- |
| Happy-path parse | `tests/adapter.test.ts` | `fixtures/basic.prisma` |
| Detect + v6/v7 layouts | `tests/detect.test.ts` | `fixtures/v6-classic`, `v7-*` |
| Invalid schemas | `tests/errors.test.ts` | `fixtures/invalid/*` |
| Relation shapes | `tests/relations.test.ts` | `fixtures/relations/catalog.prisma` |
| Parse size ladder | `tests/performance.test.ts` | generated via `tests/helpers/sized-prisma.ts` |

CLI-side (in `packages/cli/tests/`):

| Area | Test file |
| --- | --- |
| Missing / invalid Prisma load | `errors.test.ts` |
| Multi-file + `prisma.config` resolve | `scan.test.ts` |
| Watch callback latency | `watch.test.ts` |

---

## Size ladder (parse budgets)

| Size | Models | Budget |
| --- | --- | --- |
| S | 5 | &lt; 2s |
| M | 25 | &lt; 5s |
| L | 100 | &lt; 15s |
| XL | 200 | &lt; 30s |

Shared UniversalSchema sizes (layout, not Prisma-specific) live in `@erdflow/core/testing` — see layout package tests if you care about diagram timing.

---

## Manual smoke (optional)

Run the CLI against each fixture listed in [fixtures.md](./fixtures.md) using [local-development.md](./local-development.md). Confirm entity counts in the CLI banner and that the UI canvas updates on save.
