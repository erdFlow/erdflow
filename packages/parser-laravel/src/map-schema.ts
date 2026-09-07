import type {
  Constraint,
  Entity,
  Field,
  Index,
  Relation,
  SchemaMeta,
  UniversalSchema,
} from "@erdflow/core"
import {
  assertValidSchema,
  createConstraintId,
  createEntityId,
  createFieldId,
  createIndexId,
  createRelationId,
} from "@erdflow/core"
import type { TableMap } from "./apply-migrations.js"

export interface MapLaravelOptions {
  source?: string
  adapter?: string
}

export function mapTableMapToSchema(
  tables: TableMap,
  options: MapLaravelOptions = {}
): UniversalSchema {
  const entities: Entity[] = []
  const relations: Relation[] = []
  const indexes: Index[] = []
  const constraints: Constraint[] = []

  for (const table of tables.values()) {
    const fields: Field[] = [...table.columns.values()].map((column) => ({
      id: createFieldId(table.name, column.name),
      name: column.name,
      type: { name: column.typeName },
      nullable: column.nullable,
      default: column.default,
      isPrimaryKey: column.isPrimaryKey,
      isUnique: column.unique,
      idStrategy: column.idStrategy,
      comment: column.comment,
    }))

    entities.push({
      id: createEntityId(table.name),
      name: table.name,
      kind: "table",
      fields,
    })

    for (const field of fields) {
      if (field.isUnique && !field.isPrimaryKey) {
        indexes.push({
          id: createIndexId(table.name, `${field.name}_unique`),
          name: `${table.name}_${field.name}_unique`,
          entityId: createEntityId(table.name),
          fieldIds: [field.id],
          unique: true,
        })
      }
      if (field.isPrimaryKey) {
        constraints.push({
          id: createConstraintId(table.name, "primary_key", [field.name]),
          kind: "primary_key",
          entityId: createEntityId(table.name),
          fieldIds: [field.id],
        })
      }
    }

    for (const fk of table.foreignKeys) {
      if (!tables.has(fk.referencedTable)) {
        continue
      }
      const fieldIds = fk.columns.map((name) => createFieldId(table.name, name))
      const referencedFieldIds = fk.referencedColumns.map((name) =>
        createFieldId(fk.referencedTable, name)
      )

      relations.push({
        id: createRelationId(
          table.name,
          fk.referencedTable,
          fk.columns.join(",")
        ),
        from: {
          entityId: createEntityId(table.name),
          fieldIds,
        },
        to: {
          entityId: createEntityId(fk.referencedTable),
          fieldIds: referencedFieldIds,
        },
        cardinality: "one-to-many",
        onDelete: fk.onDelete,
        onUpdate: fk.onUpdate,
      })

      constraints.push({
        id: createConstraintId(table.name, "foreign_key", fk.columns),
        kind: "foreign_key",
        entityId: createEntityId(table.name),
        fieldIds,
        referencedEntityId: createEntityId(fk.referencedTable),
        referencedFieldIds,
      })
    }
  }

  const meta: SchemaMeta = {
    source: options.source,
    adapter: options.adapter ?? "laravel",
    databaseKind: "relational",
  }

  const schema: UniversalSchema = {
    entities,
    enums: [],
    relations,
    indexes,
    constraints,
    meta,
  }

  assertValidSchema(schema)
  return schema
}
