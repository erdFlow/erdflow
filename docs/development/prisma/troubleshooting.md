# Troubleshooting (Prisma)

| Symptom | What to check |
| --- | --- |
| Footer **Disconnected** / canvas waiting for schema | CLI not on `4317`. Start it with `--prisma …` (see [local-development.md](./local-development.md)). `curl http://127.0.0.1:4317/api/schema` |
| Vite `ECONNREFUSED 127.0.0.1:4317` | Same — start the CLI first |
| `Prisma schema file not found` | Path wrong; pass a `.prisma` file or a directory that contains `.prisma` files |
| Only some models in the ERD | Multi-file: all fragments must be under the resolved schema root; confirm CLI watch paths |
| Parse error on url-less v7 schema | Rebuild the CLI so `dist` includes the stub: `cd packages/prisma && pnpm exec tsup` (or `pnpm --filter @erdflow/prisma build`). Source already injects a DMMF-only stub URL; stale `dist/cli.js` will still fail. |
| Schema save does not update UI | CLI shows `Watching…`? Save a watched file; check CLI for parse errors; footer **Connected**? |
| `pnpm erdflow` arg errors | Prefer `node packages/prisma/dist/cli.js --no-open --prisma …` from monorepo root |
| `No package.json found` | Run from the `erdFlow` monorepo root |

Layouts: [layouts-v6-v7.md](./layouts-v6-v7.md). Tests: [testing.md](./testing.md).
