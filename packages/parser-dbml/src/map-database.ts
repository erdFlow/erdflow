import type { SchemaMeta, UniversalSchema } from "@erdflow/core";
import {
  assertValidSchema,
  createConstraintId,
  createEntityId,
  createEnumId,
  createFieldId,
  createIndexId,
  createRelationId,
} from "@erdflow/core";
import type {
  Constraint,
  Entity,
  Enum,
  Field,
  Index,
  Relation,
  RelationCardinality,
} from "@erdflow/core";

interface DbmlField {
  name: string;
  type?: { type_name?: string };
  pk?: boolean;
  unique?: boolean;
  not_null?: boolean;
  note?: string | { value?: string };
  dbdefault?: { value?: string; type?: string };
}

interface DbmlIndex {
  name?: string;
  unique?: boolean;
  columns?: Array<{ value?: string } | string>;
}

interface DbmlTable {
  name: string;
  note?: string | { value?: string };
  fields: DbmlField[];
  indexes?: DbmlIndex[];
}

interface DbmlEndpoint {
  tableName: string;
  fieldNames: string[];
  relation?: string;
}

interface DbmlRef {
  name?: string;
  endpoints: DbmlEndpoint[];
  onDelete?: string;
  onUpdate?: string;
}

interface DbmlEnum {
  name: string;
  values: Array<{ name: string } | string>;
}

interface DbmlSchema {
  name?: string;
  tables: DbmlTable[];
  enums?: DbmlEnum[];
  refs?: DbmlRef[];
}

interface DbmlDatabase {
  schemas: DbmlSchema[];
}

function noteValue(note?: string | { value?: string }): string | undefined {
  if (!note) {
    return undefined;
  }
  return typeof note === "string" ? note : note.value;
}

function defaultValue(field: DbmlField): string | undefined {
  const value = field.dbdefault?.value;
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

function indexColumns(index: DbmlIndex): string[] {
  return (index.columns ?? []).map((column) =>
    typeof column === "string" ? column : (column.value ?? ""),
  );
}

function relationCardinality(
  left: DbmlEndpoint,
  right: DbmlEndpoint,
): RelationCardinality {
  const leftMany = left.relation === "*";
  const rightMany = right.relation === "*";

  if (leftMany && rightMany) {
    return "many-to-many";
  }
  if (leftMany || rightMany) {
    return "one-to-many";
  }
  return "one-to-one";
}

function mapEnum(enumDef: DbmlEnum): Enum {
  return {
    id: createEnumId(enumDef.name),
    name: enumDef.name,
    values: enumDef.values.map((value) =>
      typeof value === "string" ? value : value.name,
    ),
  };
}

function mapField(tableName: string, field: DbmlField): Field {
  return {
    id: createFieldId(tableName, field.name),
    name: field.name,
    type: {
      name: field.type?.type_name ?? "unknown",
    },
    nullable: !field.not_null && !field.pk,
    default: defaultValue(field),
    isPrimaryKey: field.pk === true,
    isUnique: field.unique === true,
    comment: noteValue(field.note),
  };
}

function mapTable(table: DbmlTable): {
  entity: Entity;
  indexes: Index[];
  constraints: Constraint[];
} {
  const entityId = createEntityId(table.name);
  const fields = table.fields.map((field) => mapField(table.name, field));
  const fieldIds = new Set(fields.map((field) => field.id));

  const indexes: Index[] = (table.indexes ?? []).map((index, indexNumber) => {
    const columnNames = indexColumns(index);
    const fieldIdsForIndex = columnNames.map((columnName) =>
      createFieldId(table.name, columnName),
    );

    return {
      id: createIndexId(
        table.name,
        index.name ?? `index_${indexNumber}`,
      ),
      name: index.name ?? `index_${indexNumber}`,
      entityId,
      fieldIds: fieldIdsForIndex,
      unique: index.unique === true,
    };
  });

  const constraints: Constraint[] = [];
  const pkFields = fields.filter((field) => field.isPrimaryKey);

  for (const field of fields) {
    if (field.isPrimaryKey && pkFields.length === 1) {
      constraints.push({
        id: createConstraintId(table.name, "primary_key", [field.name]),
        kind: "primary_key",
        entityId,
        fieldIds: [field.id],
      });
    }

    if (field.isUnique) {
      constraints.push({
        id: createConstraintId(table.name, "unique", [field.name]),
        kind: "unique",
        entityId,
        fieldIds: [field.id],
      });
    }
  }

  if (pkFields.length > 1) {
    constraints.push({
      id: createConstraintId(
        table.name,
        "primary_key",
        pkFields.map((field) => field.name),
      ),
      kind: "primary_key",
      entityId,
      fieldIds: pkFields.map((field) => field.id),
    });
  }

  void fieldIds;

  return {
    entity: {
      id: entityId,
      name: table.name,
      kind: "table",
      fields,
      comment: noteValue(table.note),
    },
    indexes,
    constraints,
  };
}

function mapRef(ref: DbmlRef, refIndex: number): Relation | null {
  if (ref.endpoints.length < 2) {
    return null;
  }

  const [fromEndpoint, toEndpoint] = ref.endpoints;
  if (!fromEndpoint || !toEndpoint) {
    return null;
  }

  const fromEntity = fromEndpoint.tableName;
  const toEntity = toEndpoint.tableName;
  const fromFields = fromEndpoint.fieldNames.join(",");
  const toFields = toEndpoint.fieldNames.join(",");

  return {
    id: createRelationId(fromEntity, toEntity, `${fromFields}->${toFields}`),
    name: ref.name ?? `ref_${refIndex}`,
    from: {
      entityId: createEntityId(fromEntity),
      fieldIds: fromEndpoint.fieldNames.map((fieldName) =>
        createFieldId(fromEntity, fieldName),
      ),
    },
    to: {
      entityId: createEntityId(toEntity),
      fieldIds: toEndpoint.fieldNames.map((fieldName) =>
        createFieldId(toEntity, fieldName),
      ),
    },
    cardinality: relationCardinality(fromEndpoint, toEndpoint),
    onDelete: ref.onDelete,
    onUpdate: ref.onUpdate,
  };
}

export function mapDbmlDatabase(
  database: DbmlDatabase,
  meta?: SchemaMeta,
): UniversalSchema {
  const entities: Entity[] = [];
  const enums: Enum[] = [];
  const relations: Relation[] = [];
  const indexes: Index[] = [];
  const constraints: Constraint[] = [];

  for (const schema of database.schemas) {
    for (const enumDef of schema.enums ?? []) {
      enums.push(mapEnum(enumDef));
    }

    for (const table of schema.tables) {
      const mapped = mapTable(table);
      entities.push(mapped.entity);
      indexes.push(...mapped.indexes);
      constraints.push(...mapped.constraints);
    }

    for (const [refIndex, ref] of (schema.refs ?? []).entries()) {
      const relation = mapRef(ref, refIndex);
      if (relation) {
        relations.push(relation);

        const fkEndpoint = ref.endpoints.find(
          (endpoint) => endpoint.relation === "*" || endpoint.relation === ">",
        );
        const pkEndpoint = ref.endpoints.find(
          (endpoint) => endpoint !== fkEndpoint,
        );

        if (fkEndpoint && pkEndpoint) {
          constraints.push({
            id: createConstraintId(
              fkEndpoint.tableName,
              "foreign_key",
              fkEndpoint.fieldNames,
            ),
            kind: "foreign_key",
            entityId: createEntityId(fkEndpoint.tableName),
            fieldIds: fkEndpoint.fieldNames.map((fieldName) =>
              createFieldId(fkEndpoint.tableName, fieldName),
            ),
            referencedEntityId: createEntityId(pkEndpoint.tableName),
            referencedFieldIds: pkEndpoint.fieldNames.map((fieldName) =>
              createFieldId(pkEndpoint.tableName, fieldName),
            ),
          });
        }
      }
    }
  }

  const schema: UniversalSchema = {
    entities,
    enums,
    relations,
    indexes,
    constraints,
    meta,
  };

  assertValidSchema(schema);
  return schema;
}
