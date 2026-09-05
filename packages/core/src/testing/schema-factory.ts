import {
  createEntityId,
  createFieldId,
  createRelationId,
} from "../schema/ids.js"
import type { Entity, Relation, UniversalSchema } from "../schema/types.js"

function tableEntity(
  name: string,
  fields: Array<{
    name: string
    type?: string
    nullable?: boolean
    isPrimaryKey?: boolean
    isUnique?: boolean
  }>
): Entity {
  return {
    id: createEntityId(name),
    name,
    kind: "table",
    fields: fields.map((field) => ({
      id: createFieldId(name, field.name),
      name: field.name,
      type: { name: field.type ?? "Int" },
      nullable: field.nullable ?? false,
      isPrimaryKey: field.isPrimaryKey,
      isUnique: field.isUnique,
    })),
  }
}

/**
 * Build a chain of N tables: Table0 → Table1 → … → Table(N-1) (one-to-many).
 * Useful for layout/parser size ladders (5 / 25 / 100 / 200).
 */
export function createSizedSchema(entityCount: number): UniversalSchema {
  if (!Number.isInteger(entityCount) || entityCount < 1) {
    throw new Error(`entityCount must be a positive integer, got ${entityCount}`)
  }

  const entities: Entity[] = []
  const relations: Relation[] = []

  for (let i = 0; i < entityCount; i += 1) {
    const name = `Table${i}`
    const fields: Array<{
      name: string
      type?: string
      nullable?: boolean
      isPrimaryKey?: boolean
    }> = [
      { name: "id", isPrimaryKey: true },
      { name: "name", type: "String" },
    ]

    if (i > 0) {
      fields.push({ name: "parentId", nullable: false })
    }

    entities.push(tableEntity(name, fields))

    if (i > 0) {
      const parentName = `Table${i - 1}`
      relations.push({
        id: createRelationId(name, parentName, "parentId"),
        name: `${name}_parent`,
        from: {
          entityId: createEntityId(name),
          fieldIds: [createFieldId(name, "parentId")],
        },
        to: {
          entityId: createEntityId(parentName),
          fieldIds: [createFieldId(parentName, "id")],
        },
        cardinality: "one-to-many",
      })
    }
  }

  return {
    entities,
    enums: [],
    relations,
    indexes: [],
    constraints: [],
    meta: {
      adapter: "testing",
      source: `sized:${entityCount}`,
    },
  }
}

/**
 * Fixed graph covering common relation shapes for shared layout/parser checks:
 * 1:1, 1:N, M:N (junction), optional FK, self-relation, two relations between same pair.
 */
export function createRelationCatalogSchema(): UniversalSchema {
  const user = tableEntity("User", [
    { name: "id", isPrimaryKey: true },
    { name: "email", type: "String", isUnique: true },
  ])

  const profile = tableEntity("Profile", [
    { name: "id", isPrimaryKey: true },
    { name: "userId", isUnique: true },
    { name: "bio", type: "String", nullable: true },
  ])

  const post = tableEntity("Post", [
    { name: "id", isPrimaryKey: true },
    { name: "title", type: "String" },
    { name: "authorId" },
    { name: "editorId", nullable: true },
    { name: "optionalAuthorId", nullable: true },
  ])

  const category = tableEntity("Category", [
    { name: "id", isPrimaryKey: true },
    { name: "name", type: "String" },
    { name: "parentId", nullable: true },
  ])

  const postCategory = tableEntity("PostCategory", [
    { name: "postId", isPrimaryKey: true },
    { name: "categoryId", isPrimaryKey: true },
  ])

  const relations: Relation[] = [
    {
      id: createRelationId("Profile", "User", "userId"),
      name: "Profile_User",
      from: {
        entityId: profile.id,
        fieldIds: [createFieldId("Profile", "userId")],
      },
      to: {
        entityId: user.id,
        fieldIds: [createFieldId("User", "id")],
      },
      cardinality: "one-to-one",
    },
    {
      id: createRelationId("Post", "User", "authorId"),
      name: "Post_author",
      from: {
        entityId: post.id,
        fieldIds: [createFieldId("Post", "authorId")],
      },
      to: {
        entityId: user.id,
        fieldIds: [createFieldId("User", "id")],
      },
      cardinality: "one-to-many",
    },
    {
      id: createRelationId("Post", "User", "editorId"),
      name: "Post_editor",
      from: {
        entityId: post.id,
        fieldIds: [createFieldId("Post", "editorId")],
      },
      to: {
        entityId: user.id,
        fieldIds: [createFieldId("User", "id")],
      },
      cardinality: "one-to-many",
    },
    {
      id: createRelationId("Post", "User", "optionalAuthorId"),
      name: "Post_optionalAuthor",
      from: {
        entityId: post.id,
        fieldIds: [createFieldId("Post", "optionalAuthorId")],
      },
      to: {
        entityId: user.id,
        fieldIds: [createFieldId("User", "id")],
      },
      cardinality: "one-to-many",
    },
    {
      id: createRelationId("Category", "Category", "parentId"),
      name: "Category_parent",
      from: {
        entityId: category.id,
        fieldIds: [createFieldId("Category", "parentId")],
      },
      to: {
        entityId: category.id,
        fieldIds: [createFieldId("Category", "id")],
      },
      cardinality: "one-to-many",
    },
    {
      id: createRelationId("PostCategory", "Post", "postId"),
      name: "PostCategory_Post",
      from: {
        entityId: postCategory.id,
        fieldIds: [createFieldId("PostCategory", "postId")],
      },
      to: {
        entityId: post.id,
        fieldIds: [createFieldId("Post", "id")],
      },
      cardinality: "many-to-many",
    },
    {
      id: createRelationId("PostCategory", "Category", "categoryId"),
      name: "PostCategory_Category",
      from: {
        entityId: postCategory.id,
        fieldIds: [createFieldId("PostCategory", "categoryId")],
      },
      to: {
        entityId: category.id,
        fieldIds: [createFieldId("Category", "id")],
      },
      cardinality: "many-to-many",
    },
  ]

  return {
    entities: [user, profile, post, category, postCategory],
    enums: [],
    relations,
    indexes: [],
    constraints: [],
    meta: {
      adapter: "testing",
      source: "relation-catalog",
    },
  }
}
