import type { Relation } from "@erdflow/core"
import {
  createEntityId,
  createFieldId,
  createRelationId,
} from "@erdflow/core"
import { defaultForeignKey, modelNameToTable } from "./naming.js"
import type {
  ParsedEloquentModel,
  ParsedEloquentRelation,
} from "./parse-model.js"

export interface ModelTableResolver {
  /** Model class basename → resolved table name. */
  tableForModel(className: string): string | undefined
  /** Whether a table exists in the migration TableMap / schema entities. */
  hasTable(tableName: string): boolean
}

export function buildModelTableIndex(
  models: ParsedEloquentModel[]
): Map<string, string> {
  const index = new Map<string, string>()
  for (const model of models) {
    index.set(model.className, model.table ?? modelNameToTable(model.className))
  }
  return index
}

function resolveTable(
  className: string,
  resolver: ModelTableResolver
): string | undefined {
  return resolver.tableForModel(className)
}

/**
 * Map parsed Eloquent relation calls to draft UniversalSchema relations.
 * Only emits when both endpoint tables (and pivot for M2M) exist.
 */
export function eloquentRelationsToDraft(
  model: ParsedEloquentModel,
  resolver: ModelTableResolver
): Relation[] {
  const thisTable = model.table ?? modelNameToTable(model.className)
  if (!resolver.hasTable(thisTable)) {
    return []
  }

  const drafts: Relation[] = []
  for (const rel of model.relations) {
    const draft = mapOneRelation(thisTable, model.className, rel, resolver)
    if (draft) {
      drafts.push(draft)
    }
  }
  return drafts
}

function mapOneRelation(
  thisTable: string,
  thisModel: string,
  rel: ParsedEloquentRelation,
  resolver: ModelTableResolver
): Relation | null {
  const relatedTable = resolveTable(rel.relatedModel, resolver)
  if (!relatedTable || !resolver.hasTable(relatedTable)) {
    return null
  }

  if (rel.kind === "belongsToMany") {
    return mapBelongsToMany(thisTable, relatedTable, rel, resolver)
  }

  if (rel.kind === "belongsTo") {
    const fk = rel.foreignKey ?? defaultForeignKey(rel.relatedModel)
    const ownerKey = rel.ownerKey ?? "id"
    return {
      id: createRelationId(thisTable, relatedTable, fk),
      name: rel.methodName,
      from: {
        entityId: createEntityId(thisTable),
        fieldIds: [createFieldId(thisTable, fk)],
      },
      to: {
        entityId: createEntityId(relatedTable),
        fieldIds: [createFieldId(relatedTable, ownerKey)],
      },
      cardinality: "one-to-many",
    }
  }

  // hasOne / hasMany — FK on related table
  const fk = rel.foreignKey ?? defaultForeignKey(thisModel)
  const localKey = rel.ownerKey ?? "id"
  return {
    id: createRelationId(relatedTable, thisTable, fk),
    name: rel.methodName,
    from: {
      entityId: createEntityId(relatedTable),
      fieldIds: [createFieldId(relatedTable, fk)],
    },
    to: {
      entityId: createEntityId(thisTable),
      fieldIds: [createFieldId(thisTable, localKey)],
    },
    cardinality: "one-to-many",
  }
}

function mapBelongsToMany(
  thisTable: string,
  relatedTable: string,
  rel: ParsedEloquentRelation,
  resolver: ModelTableResolver
): Relation | null {
  const pivot =
    rel.pivotTable ??
    [thisTable, relatedTable].sort((a, b) => a.localeCompare(b)).join("_")

  if (!resolver.hasTable(pivot)) {
    return null
  }

  // Endpoints are the two models; pivot must exist. Field refs use PKs so
  // UniversalSchema validation stays happy without inventing pivot FKs here.
  const [fromTable, toTable] =
    thisTable.localeCompare(relatedTable) <= 0
      ? [thisTable, relatedTable]
      : [relatedTable, thisTable]

  return {
    id: createRelationId(fromTable, toTable, `via:${pivot}`),
    name: rel.methodName,
    from: {
      entityId: createEntityId(fromTable),
      fieldIds: [createFieldId(fromTable, "id")],
    },
    to: {
      entityId: createEntityId(toTable),
      fieldIds: [createFieldId(toTable, "id")],
    },
    cardinality: "many-to-many",
  }
}

export function collectEloquentDraftRelations(
  models: ParsedEloquentModel[],
  tableNames: Set<string>
): Relation[] {
  const index = buildModelTableIndex(models)
  const resolver: ModelTableResolver = {
    tableForModel(className) {
      return index.get(className) ?? modelNameToTable(className)
    },
    hasTable(name) {
      return tableNames.has(name)
    },
  }

  const drafts: Relation[] = []
  for (const model of models) {
    drafts.push(...eloquentRelationsToDraft(model, resolver))
  }
  return drafts
}
