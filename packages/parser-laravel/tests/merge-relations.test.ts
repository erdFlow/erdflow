import assert from "node:assert/strict"
import test from "node:test"
import {
  createEntityId,
  createFieldId,
  createRelationId,
  type Relation,
  type UniversalSchema,
} from "@erdflow/core"
import { collectEloquentDraftRelations } from "../src/eloquent-relations.js"
import {
  mergeEloquentRelations,
  relationsMatch,
} from "../src/merge-relations.js"
import type { ParsedEloquentModel } from "../src/parse-model.js"

function baseSchema(extra?: Partial<UniversalSchema>): UniversalSchema {
  return {
    entities: [
      {
        id: createEntityId("posts"),
        name: "posts",
        kind: "table",
        fields: [
          {
            id: createFieldId("posts", "id"),
            name: "id",
            type: { name: "bigint" },
            nullable: false,
            isPrimaryKey: true,
          },
          {
            id: createFieldId("posts", "user_id"),
            name: "user_id",
            type: { name: "bigint" },
            nullable: false,
          },
        ],
      },
      {
        id: createEntityId("users"),
        name: "users",
        kind: "table",
        fields: [
          {
            id: createFieldId("users", "id"),
            name: "id",
            type: { name: "bigint" },
            nullable: false,
            isPrimaryKey: true,
          },
        ],
      },
    ],
    enums: [],
    relations: [
      {
        id: createRelationId("posts", "users", "user_id"),
        from: {
          entityId: createEntityId("posts"),
          fieldIds: [createFieldId("posts", "user_id")],
        },
        to: {
          entityId: createEntityId("users"),
          fieldIds: [createFieldId("users", "id")],
        },
        cardinality: "one-to-many",
        onDelete: "CASCADE",
      },
    ],
    indexes: [],
    constraints: [],
    meta: { adapter: "laravel" },
    ...extra,
  }
}

test("relationsMatch equates migration FK and Eloquent belongsTo", () => {
  const migration = baseSchema().relations[0]!
  const eloquent: Relation = {
    id: createRelationId("posts", "users", "user_id"),
    name: "user",
    from: {
      entityId: createEntityId("posts"),
      fieldIds: [createFieldId("posts", "user_id")],
    },
    to: {
      entityId: createEntityId("users"),
      fieldIds: [createFieldId("users", "id")],
    },
    cardinality: "one-to-many",
  }
  assert.equal(relationsMatch(migration, eloquent), true)
})

test("mergeEloquentRelations names existing FK and adds soft FK", () => {
  const schema = baseSchema({
    entities: [
      ...baseSchema().entities,
      {
        id: createEntityId("comments"),
        name: "comments",
        kind: "table",
        fields: [
          {
            id: createFieldId("comments", "id"),
            name: "id",
            type: { name: "bigint" },
            nullable: false,
            isPrimaryKey: true,
          },
          {
            id: createFieldId("comments", "post_id"),
            name: "post_id",
            type: { name: "bigint" },
            nullable: false,
          },
        ],
      },
    ],
  })

  const models: ParsedEloquentModel[] = [
    {
      className: "Post",
      relations: [
        {
          methodName: "user",
          kind: "belongsTo",
          relatedModel: "User",
        },
        {
          methodName: "comments",
          kind: "hasMany",
          relatedModel: "Comment",
        },
      ],
    },
    {
      className: "Comment",
      relations: [
        {
          methodName: "post",
          kind: "belongsTo",
          relatedModel: "Post",
        },
      ],
    },
  ]

  const drafts = collectEloquentDraftRelations(
    models,
    new Set(["posts", "users", "comments"])
  )
  const merged = mergeEloquentRelations(schema, drafts)

  const named = merged.relations.find((r) =>
    r.id.includes("posts") && r.id.includes("users")
  )
  assert.ok(named)
  assert.equal(named.name, "user")

  const soft = merged.relations.find(
    (r) =>
      r.name === "post" ||
      (r.id.includes("comments") && r.id.includes("posts"))
  )
  assert.ok(soft)
  assert.ok(merged.relations.length >= 2)
})

test("mergeEloquentRelations adds belongsToMany when pivot exists", () => {
  const schema = baseSchema({
    entities: [
      ...baseSchema().entities,
      {
        id: createEntityId("tags"),
        name: "tags",
        kind: "table",
        fields: [
          {
            id: createFieldId("tags", "id"),
            name: "id",
            type: { name: "bigint" },
            nullable: false,
            isPrimaryKey: true,
          },
        ],
      },
      {
        id: createEntityId("tag_user"),
        name: "tag_user",
        kind: "table",
        fields: [
          {
            id: createFieldId("tag_user", "id"),
            name: "id",
            type: { name: "bigint" },
            nullable: false,
            isPrimaryKey: true,
          },
        ],
      },
    ],
    relations: [],
  })

  const models: ParsedEloquentModel[] = [
    {
      className: "User",
      relations: [
        {
          methodName: "tags",
          kind: "belongsToMany",
          relatedModel: "Tag",
          pivotTable: "tag_user",
        },
      ],
    },
  ]

  const drafts = collectEloquentDraftRelations(
    models,
    new Set(["posts", "users", "tags", "tag_user"])
  )
  const merged = mergeEloquentRelations(schema, drafts)
  const m2m = merged.relations.find((r) => r.cardinality === "many-to-many")
  assert.ok(m2m)
  assert.equal(m2m.name, "tags")
})
