# @erdflow/core

Universal schema model for [erdFlow](https://github.com/erdFlow/erdflow) — shared TypeScript types, validation, and adapter interfaces used by parsers and the visualizer.

Every schema format (Prisma, DBML, SQL, …) is normalized into a single **`UniversalSchema`** so the layout engine and ERD UI can work with one data model.

## Install

```bash
npm install @erdflow/core
```

Requires **Node.js ≥ 20**.

## Usage

### Types

```ts
import type {
  UniversalSchema,
  Entity,
  Field,
  Relation,
  Enum,
} from "@erdflow/core";
```

### Stable IDs

Use branded ID helpers so graph nodes stay stable across re-parses:

```ts
import {
  createEntityId,
  createFieldId,
  createRelationId,
  createEnumId,
} from "@erdflow/core";

const userId = createEntityId("User");
const emailId = createFieldId("User", "email");
const postsRelationId = createRelationId("User", "Post", "posts");
```

### Validation

Validate a schema before rendering or exporting:

```ts
import { validateSchema, assertValidSchema, SchemaValidationError } from "@erdflow/core";

const result = validateSchema(schema);

if (!result.valid) {
  for (const issue of result.issues) {
    console.error(`${issue.severity}: ${issue.message}`);
  }
}

// Or throw on errors:
try {
  assertValidSchema(schema);
} catch (error) {
  if (error instanceof SchemaValidationError) {
    console.error(error.issues);
  }
}
```

### Schema adapters

Implement `SchemaAdapter` to add a new input format:

```ts
import type {
  SchemaAdapter,
  ProjectContext,
  UniversalSchema,
} from "@erdflow/core";

export const myAdapter: SchemaAdapter = {
  name: "my-format",
  async detect(project: ProjectContext) {
    // return true if this project uses your format
    return false;
  },
  async parse(input: string): Promise<UniversalSchema> {
    // parse source text → UniversalSchema
    return { entities: [], enums: [], relations: [], indexes: [], constraints: [] };
  },
};
```

## What's included

| Module | Description |
| --- | --- |
| `schema` | `UniversalSchema`, entities, fields, relations, enums, indexes, constraints |
| `adapter` | `SchemaAdapter` interface for format-specific parsers |
| `validation` | `validateSchema()` and structured validation issues |

## Related packages

| Package | Description |
| --- | --- |
| [`@erdflow/prisma`](https://www.npmjs.com/package/@erdflow/prisma) | Published CLI — `npx @erdflow/prisma` |
| `@erdflow/parser-prisma` | Prisma schema adapter (monorepo) |
| `@erdflow/layout` | ELK.js graph layout (monorepo) |
| `@erdflow/web` | React visualizer (monorepo) |

`@erdflow/core` is a **private** monorepo package — not intended for direct npm install by end users.

## License

MIT © [erdFlow](https://github.com/erdFlow/erdflow)
