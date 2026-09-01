import type { UniversalSchema } from "@erdflow/core";

function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function schemaTopologyHash(schema: UniversalSchema): string {
  const parts: string[] = [];

  for (const entity of schema.entities) {
    parts.push(`entity:${entity.id}:${entity.fields.length}`);
  }

  for (const enumDef of schema.enums) {
    parts.push(`enum:${enumDef.id}:${enumDef.values.length}`);
  }

  for (const relation of schema.relations) {
    parts.push(
      `relation:${relation.id}:${relation.from.entityId}->${relation.to.entityId}`,
    );
  }

  parts.sort();
  return fnv1aHash(parts.join("|"));
}
