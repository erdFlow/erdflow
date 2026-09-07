import assert from "node:assert/strict"
import test from "node:test"
import {
  createEntityId,
  createFieldId,
  type UniversalSchema,
} from "@erdflow/core"
import { entityToDocument } from "../../src/lib/entity-to-document.js"
import { entityToSql } from "../../src/lib/entity-to-sql.js"

function pgUuidCuidSchema(): UniversalSchema {
  const userId = createEntityId("User")
  return {
    entities: [
      {
        id: userId,
        name: "User",
        kind: "table",
        fields: [
          {
            id: createFieldId("User", "id"),
            name: "id",
            type: { name: "String" },
            nullable: false,
            isPrimaryKey: true,
            idStrategy: "uuid",
            default: JSON.stringify({ name: "uuid", args: [] }),
          },
          {
            id: createFieldId("User", "profileId"),
            name: "profileId",
            type: { name: "String" },
            nullable: false,
            isUnique: true,
            idStrategy: "cuid",
            default: JSON.stringify({ name: "cuid", args: [] }),
          },
        ],
      },
    ],
    enums: [],
    relations: [],
    indexes: [],
    constraints: [
      {
        id: "constraint:user.pk" as never,
        kind: "primary_key",
        entityId: userId,
        fieldIds: [createFieldId("User", "id")],
      },
    ],
    meta: {
      provider: "postgresql",
      databaseKind: "relational",
    },
  }
}

function mongoSchema(): UniversalSchema {
  const userId = createEntityId("User")
  return {
    entities: [
      {
        id: userId,
        name: "User",
        kind: "collection",
        fields: [
          {
            id: createFieldId("User", "id"),
            name: "id",
            type: { name: "String", native: "ObjectId" },
            nullable: false,
            isPrimaryKey: true,
            idStrategy: "objectId",
            default: JSON.stringify({ name: "auto", args: [] }),
          },
          {
            id: createFieldId("User", "email"),
            name: "email",
            type: { name: "String" },
            nullable: false,
            isUnique: true,
          },
        ],
      },
    ],
    enums: [],
    relations: [],
    indexes: [],
    constraints: [],
    meta: {
      provider: "mongodb",
      databaseKind: "document",
    },
  }
}

test("entityToSql uses UUID default for postgres uuid strategy", () => {
  const schema = pgUuidCuidSchema()
  const sql = entityToSql(schema, createEntityId("User"))
  assert.ok(sql)
  assert.match(sql, /UUID/)
  assert.match(sql, /gen_random_uuid\(\)/)
  assert.match(sql, /@default\(cuid\(\)\)/)
  assert.doesNotMatch(sql, /DEFAULT cuid/i)
  assert.doesNotMatch(sql, /DEFAULT \{.*"cuid"/i)
})

test("entityToSql returns null for document schemas", () => {
  const schema = mongoSchema()
  assert.equal(entityToSql(schema, createEntityId("User")), null)
})

test("entityToDocument shows ObjectId and collection shape", () => {
  const schema = mongoSchema()
  const doc = entityToDocument(schema, createEntityId("User"))
  assert.ok(doc)
  assert.match(doc, /collection: User/)
  assert.match(doc, /ObjectId/)
  assert.match(doc, /_id/)
  assert.doesNotMatch(doc, /CREATE TABLE/)
})
