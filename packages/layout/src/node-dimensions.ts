import type { Entity, Enum } from "@erdflow/core";

export const ENTITY_NODE_WIDTH = 220;
export const ENTITY_HEADER_HEIGHT = 48;
export const ENTITY_ROW_HEIGHT = 24;
export const ENTITY_MIN_HEIGHT = 80;

export const ENUM_NODE_WIDTH = 180;
export const ENUM_HEADER_HEIGHT = 48;
export const ENUM_ROW_HEIGHT = 20;
export const ENUM_MIN_HEIGHT = 72;

export function entityFieldCenterY(fieldIndex: number): number {
  return (
    ENTITY_HEADER_HEIGHT +
    fieldIndex * ENTITY_ROW_HEIGHT +
    ENTITY_ROW_HEIGHT / 2
  );
}

export function entityNodeHeight(entity: Entity): number {
  return Math.max(
    ENTITY_MIN_HEIGHT,
    ENTITY_HEADER_HEIGHT + entity.fields.length * ENTITY_ROW_HEIGHT,
  );
}

export function enumNodeHeight(enumDef: Enum): number {
  return Math.max(
    ENUM_MIN_HEIGHT,
    ENUM_HEADER_HEIGHT + enumDef.values.length * ENUM_ROW_HEIGHT,
  );
}

export function entityNodeDimensions(entity: Entity): {
  width: number;
  height: number;
} {
  return {
    width: ENTITY_NODE_WIDTH,
    height: entityNodeHeight(entity),
  };
}

export function enumNodeDimensions(enumDef: Enum): {
  width: number;
  height: number;
} {
  return {
    width: ENUM_NODE_WIDTH,
    height: enumNodeHeight(enumDef),
  };
}
