import type {
  Constraint,
  Entity,
  Enum,
  Field,
  Index,
  Relation,
  RelationCardinality,
  SchemaMeta,
  UniversalSchema,
} from "@erdflow/core"
import {
  assertValidSchema,
  createConstraintId,
  createEntityId,
  createEnumId,
  createFieldId,
  createIndexId,
  createRelationId,
  normalizeReferentialAction,
} from "@erdflow/core"
import prismaInternals from "@prisma/internals"

const { getDMMF } = prismaInternals

interface DmmfField {
  name: string
  kind: string
  type: string
  isList: boolean
  isRequired: boolean
  isUnique: boolean
  isId: boolean
  hasDefaultValue?: boolean
  default?: unknown
  nativeType?: [string, unknown[]] | null
  relationName?: string | null
  relationFromFields?: string[]
  relationToFields?: string[]
  relationOnDelete?: string | null
  relationOnUpdate?: string | null
  documentation?: string | null
}

interface DmmfModel {
  name: string
  fields: DmmfField[]
  primaryKey?: { fields: string[] } | null
  uniqueFields?: string[][]
  indexes?: Array<{ name?: string | null; fields: string[] }>
  documentation?: string | null
}

interface DmmfEnum {
  name: string
  values: Array<{ name: string }>
}

interface DmmfDocument {
  datamodel: {
    models: DmmfModel[]
    enums: DmmfEnum[]
    indexes?: Array<{
      model: string
      type: string
      dbName?: string | null
      fields: Array<{ name: string }>
    }>
  }
}

function formatDefault(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === "string") {
    return value
  }
  return JSON.stringify(value)
}

function mapScalarField(modelName: string, field: DmmfField): Field {
  const nativeType = field.nativeType?.[0]
  return {
    id: createFieldId(modelName, field.name),
    name: field.name,
    type: {
      name: field.type,
      native: nativeType,
      isArray: field.isList,
    },
    nullable: !field.isRequired,
    default: field.hasDefaultValue ? formatDefault(field.default) : undefined,
    isPrimaryKey: field.isId,
    isUnique: field.isUnique,
    comment: field.documentation ?? undefined,
  }
}

function mapModel(model: DmmfModel): {
  entity: Entity
  constraints: Constraint[]
} {
  const entityId = createEntityId(model.name)
  const scalarFields = model.fields.filter((field) => field.kind !== "object")
  const fields = scalarFields.map((field) => mapScalarField(model.name, field))

  for (const field of model.fields) {
    if (field.kind === "object") {
      continue
    }
    if (
      field.isId &&
      !fields.find((entry) => entry.name === field.name)?.isPrimaryKey
    ) {
      const mapped = fields.find((entry) => entry.name === field.name)
      if (mapped) {
        mapped.isPrimaryKey = true
      }
    }
  }

  const pkFieldNames =
    model.primaryKey?.fields ??
    fields.filter((field) => field.isPrimaryKey).map((field) => field.name)

  const constraints: Constraint[] = []
  if (pkFieldNames.length > 0) {
    constraints.push({
      id: createConstraintId(model.name, "primary_key", pkFieldNames),
      kind: "primary_key",
      entityId,
      fieldIds: pkFieldNames.map((fieldName) =>
        createFieldId(model.name, fieldName)
      ),
    })
  }

  for (const field of fields) {
    if (field.isUnique) {
      constraints.push({
        id: createConstraintId(model.name, "unique", [field.name]),
        kind: "unique",
        entityId,
        fieldIds: [field.id],
      })
    }
  }

  for (const uniqueFields of model.uniqueFields ?? []) {
    if (uniqueFields.length > 1) {
      constraints.push({
        id: createConstraintId(model.name, "unique", uniqueFields),
        kind: "unique",
        entityId,
        fieldIds: uniqueFields.map((fieldName) =>
          createFieldId(model.name, fieldName)
        ),
      })
    }
  }

  return {
    entity: {
      id: entityId,
      name: model.name,
      kind: "model",
      fields,
      comment: model.documentation ?? undefined,
    },
    constraints,
  }
}

function mapDatamodelIndexes(
  indexes: NonNullable<DmmfDocument["datamodel"]["indexes"]>
): Index[] {
  return indexes
    .filter((index) => index.type === "normal")
    .map((index, indexNumber) => ({
      id: createIndexId(index.model, index.dbName ?? `index_${indexNumber}`),
      name: index.dbName ?? `index_${indexNumber}`,
      entityId: createEntityId(index.model),
      fieldIds: index.fields.map((field) =>
        createFieldId(index.model, field.name)
      ),
      unique: false,
    }))
}

function inferCardinality(
  fkSide: DmmfField,
  inverse?: DmmfField
): RelationCardinality {
  if (fkSide.isList && inverse?.isList) {
    return "many-to-many"
  }
  if (fkSide.isList || inverse?.isList) {
    return "one-to-many"
  }
  return "one-to-one"
}

function mapRelations(models: DmmfModel[]): Relation[] {
  const relations: Relation[] = []
  const seen = new Set<string>()

  for (const model of models) {
    for (const field of model.fields) {
      if (field.kind !== "object" || !field.relationFromFields?.length) {
        continue
      }

      const relationKey = field.relationName ?? `${model.name}.${field.name}`
      if (seen.has(relationKey)) {
        continue
      }
      seen.add(relationKey)

      const referencedModel = models.find((entry) => entry.name === field.type)
      const inverse = referencedModel?.fields.find(
        (entry) =>
          entry.kind === "object" && entry.relationName === field.relationName
      )

      let fromEntity: string
      let toEntity: string
      let fromFieldNames: string[]
      let toFieldNames: string[]

      if (inverse?.isList) {
        fromEntity = field.type
        toEntity = model.name
        fromFieldNames = field.relationToFields ?? []
        toFieldNames = field.relationFromFields
      } else {
        fromEntity = field.type
        toEntity = model.name
        fromFieldNames = field.relationToFields ?? []
        toFieldNames = field.relationFromFields
      }

      relations.push({
        id: createRelationId(
          fromEntity,
          toEntity,
          `${fromFieldNames.join(",")}->${toFieldNames.join(",")}`
        ),
        name: relationKey,
        from: {
          entityId: createEntityId(fromEntity),
          fieldIds: fromFieldNames.map((fieldName) =>
            createFieldId(fromEntity, fieldName)
          ),
        },
        to: {
          entityId: createEntityId(toEntity),
          fieldIds: toFieldNames.map((fieldName) =>
            createFieldId(toEntity, fieldName)
          ),
        },
        cardinality: inferCardinality(field, inverse),
        onDelete: normalizeReferentialAction(field.relationOnDelete),
        onUpdate: normalizeReferentialAction(field.relationOnUpdate),
      })
    }
  }

  return relations
}

function mapForeignKeyConstraints(
  models: DmmfModel[],
  relations: Relation[]
): Constraint[] {
  const constraints: Constraint[] = []

  for (const model of models) {
    for (const field of model.fields) {
      if (field.kind !== "object" || !field.relationFromFields?.length) {
        continue
      }

      constraints.push({
        id: createConstraintId(
          model.name,
          "foreign_key",
          field.relationFromFields
        ),
        kind: "foreign_key",
        entityId: createEntityId(model.name),
        fieldIds: field.relationFromFields.map((fieldName) =>
          createFieldId(model.name, fieldName)
        ),
        referencedEntityId: createEntityId(field.type),
        referencedFieldIds: (field.relationToFields ?? []).map((fieldName) =>
          createFieldId(field.type, fieldName)
        ),
      })
    }
  }

  void relations
  return constraints
}

/**
 * Prisma v7 moves `url` to prisma.config.ts; schemas may omit it.
 * `@prisma/internals` v6 still requires `url` for getDMMF — inject a stub.
 */
export function normalizeDatamodelForDmmf(datamodel: string): string {
  return datamodel.replace(
    /datasource\s+(\w+)\s*\{([^}]*)\}/g,
    (full, name: string, body: string) => {
      if (/\burl\s*=/.test(body)) {
        return full
      }
      const trimmed = body.replace(/\s*$/, "")
      const sep = trimmed.endsWith("\n") ? "" : "\n"
      return `datasource ${name} {${trimmed}${sep}  url = env("DATABASE_URL")\n}`
    }
  )
}

export async function parsePrismaSchema(
  input: string,
  meta?: SchemaMeta
): Promise<UniversalSchema> {
  const datamodel = normalizeDatamodelForDmmf(input)
  const dmmf = (await getDMMF({
    datamodel,
  })) as unknown as DmmfDocument

  const entities: Entity[] = []
  const indexes: Index[] = []
  const constraints: Constraint[] = []

  for (const model of dmmf.datamodel.models) {
    const mapped = mapModel(model)
    entities.push(mapped.entity)
    constraints.push(...mapped.constraints)
  }

  indexes.push(...mapDatamodelIndexes(dmmf.datamodel.indexes ?? []))

  const enums: Enum[] = dmmf.datamodel.enums.map((enumDef) => ({
    id: createEnumId(enumDef.name),
    name: enumDef.name,
    values: enumDef.values.map((value) => value.name),
  }))

  const relations = mapRelations(dmmf.datamodel.models)
  constraints.push(
    ...mapForeignKeyConstraints(dmmf.datamodel.models, relations)
  )

  const schema: UniversalSchema = {
    entities,
    enums,
    relations,
    indexes,
    constraints,
    meta,
  }

  assertValidSchema(schema)
  return schema
}
