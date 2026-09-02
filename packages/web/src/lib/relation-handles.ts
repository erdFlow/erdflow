import type { Relation, UniversalSchema } from "@erdflow/core";

/**
 * Stable node-level handle ids. Every table/enum node renders one hidden source
 * handle (right) and one hidden target handle (left) with these ids, so every
 * relation edge always has a valid handle to bind to — even relations that carry
 * no `fieldIds`. The actual visual routing is computed by `RelationEdge` from
 * live node geometry, so the fixed handle side here does not constrain the line.
 */
export const NODE_SOURCE_HANDLE_ID = "node-source";
export const NODE_TARGET_HANDLE_ID = "node-target";

export interface ResolvedRelationHandles {
  sourceHandle: string;
  targetHandle: string;
  /** Index of the anchored field row in the source entity, if known. */
  fromFieldIndex?: number;
  /** Index of the anchored field row in the target entity, if known. */
  toFieldIndex?: number;
}

/**
 * Resolves the handle ids and (best-effort) field row indices for a relation.
 * Composite FKs anchor to their first column only.
 */
export function resolveRelationHandles(
  schema: UniversalSchema,
  relation: Relation,
): ResolvedRelationHandles {
  const fromEntity = schema.entities.find(
    (entity) => entity.id === relation.from.entityId,
  );
  const toEntity = schema.entities.find(
    (entity) => entity.id === relation.to.entityId,
  );

  const fromFieldId = relation.from.fieldIds?.[0];
  const toFieldId = relation.to.fieldIds?.[0];

  const fromFieldIndex =
    fromFieldId && fromEntity
      ? fromEntity.fields.findIndex((field) => field.id === fromFieldId)
      : -1;
  const toFieldIndex =
    toFieldId && toEntity
      ? toEntity.fields.findIndex((field) => field.id === toFieldId)
      : -1;

  return {
    sourceHandle: NODE_SOURCE_HANDLE_ID,
    targetHandle: NODE_TARGET_HANDLE_ID,
    fromFieldIndex: fromFieldIndex >= 0 ? fromFieldIndex : undefined,
    toFieldIndex: toFieldIndex >= 0 ? toFieldIndex : undefined,
  };
}
