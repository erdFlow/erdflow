import type { Entity, Enum } from "@erdflow/core";

export function entityNodeHeight(entity: Entity): number {
  return Math.max(80, 48 + entity.fields.length * 24);
}

export function enumNodeHeight(enumDef: Enum): number {
  return Math.max(72, 48 + enumDef.values.length * 20);
}
