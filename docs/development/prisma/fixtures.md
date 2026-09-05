# Prisma fixtures

All paths are under `packages/parser-prisma/fixtures/`.

```text
fixtures/
├── basic.prisma                 # classic multi-model schema
├── v6-classic/schema.prisma     # url in datasource, prisma-client-js
├── v7-url-less/schema.prisma    # no url; generator prisma-client
├── v7-multifile/                # prisma.config.ts + prisma/schema/*.prisma
├── v7-config-custom/            # config → db/schema.prisma
├── invalid/
│   ├── syntax.prisma
│   ├── empty.prisma
│   ├── broken-relation.prisma
│   └── duplicate-model.prisma
└── relations/catalog.prisma     # 1:1, 1:N, junction, self, multi-rel to User
```

## Feature → fixture

| Feature | Fixture |
| --- | --- |
| Default smoke / UI demo | `basic.prisma` |
| Prisma ORM v6 classic | `v6-classic/` |
| v7 datasource without `url` | `v7-url-less/` |
| Multi-file schema folder | `v7-multifile/` |
| Custom path via `prisma.config.ts` | `v7-config-custom/` |
| Bad syntax / empty / broken FK / duplicate model | `invalid/*` |
| Relation catalog | `relations/catalog.prisma` |

CLI examples: [local-development.md](./local-development.md). Automated coverage: [testing.md](./testing.md).
