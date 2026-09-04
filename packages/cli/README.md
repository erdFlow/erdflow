# erdflow

Local-first database schema IDE — detect your project's schema, parse it, and open an interactive ERD in the browser.

```bash
npx erdflow
```

## What it does

1. **Detects** your schema file (Prisma → DBML → SQL)
2. **Parses** it into a universal schema model
3. **Starts** a local server at `http://127.0.0.1:4317`
4. **Opens** the browser with an interactive entity-relationship diagram

Example output:

```
✓ Detected Prisma
✓ prisma/schema.prisma
✓ 12 entities · 2 enums · 11 relations · 3 indexes
→ http://127.0.0.1:4317/

Watching schema files for changes...
```

## Quick start

From any project with a Prisma, DBML, or SQL schema:

```bash
npx erdflow
```

Or install globally:

```bash
npm install -g erdflow
erdflow
```

## Usage

### Auto-detect (default)

Detection order: `prisma/schema.prisma` → `*.dbml` → `*.sql`

### Explicit schema path

```bash
npx erdflow --prisma ./prisma/schema.prisma
npx erdflow --dbml ./database/schema.dbml
```

### Options

| Flag | Description |
| --- | --- |
| `--port <number>` | Server port (default `4317`) |
| `--no-open` | Skip auto-opening the browser |
| `--no-watch` | Disable file watching |
| `--prisma <path>` | Use a specific Prisma schema file |
| `--dbml <path>` | Use a specific DBML file |

Examples:

```bash
npx erdflow --port 5000
npx erdflow --no-open --dbml ./docs/schema.dbml
npx erdflow --no-watch --prisma ./custom/schema.prisma
```

## Supported formats

| Format | Location | Notes |
| --- | --- | --- |
| Prisma | `prisma/schema.prisma` | Models, relations, enums, indexes |
| DBML | `*.dbml` | Tables, relationships, enums |
| SQL | `*.sql` | PostgreSQL, MySQL, SQLite |

## Live updates

With watch enabled (default), editing your schema file re-parses and pushes updates to the browser over WebSocket — no manual refresh needed.

When a parse error occurs during watch, the CLI prints the error and the browser shows an alert while keeping the last valid schema.

## Requirements

- **Node.js ≥ 20**

## Related packages

| Package | Description |
| --- | --- |
| [`@erdflow/core`](https://www.npmjs.com/package/@erdflow/core) | Universal schema types and validation |
| `@erdflow/web` | React visualizer (embed in your app) |
| `@erdflow/layout` | ELK.js graph layout engine |

## Links

- [GitHub](https://github.com/erdFlow/erdflow)
- [Issues](https://github.com/erdFlow/erdflow/issues)

## License

MIT © [erdFlow](https://github.com/erdFlow/erdflow)
