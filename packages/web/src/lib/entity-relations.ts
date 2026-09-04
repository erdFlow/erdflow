import type { UniversalSchema } from "@erdflow/core"
import { cardinalitySymbols } from "./edge-geometry.js"

export interface EntityRelationRow {
  id: string
  fromName: string
  toName: string
  fromCard: string
  toCard: string
}

function displayCard(symbol: string): string {
  return symbol === "n" ? "N" : symbol
}

/** Relations involving the focused entity, formatted for the relationship table. */
export function getEntityRelationRows(
  schema: UniversalSchema,
  entityId: string
): EntityRelationRow[] {
  const byId = new Map(
    schema.entities.map((entity) => [entity.id, entity.name])
  )

  const rows: EntityRelationRow[] = []

  for (const relation of schema.relations) {
    if (
      relation.from.entityId !== entityId &&
      relation.to.entityId !== entityId
    ) {
      continue
    }

    const fromName = byId.get(relation.from.entityId)
    const toName = byId.get(relation.to.entityId)
    if (!fromName || !toName) {
      continue
    }

    const symbols = cardinalitySymbols(relation.cardinality)
    rows.push({
      id: relation.id,
      fromName,
      toName,
      fromCard: displayCard(symbols.source),
      toCard: displayCard(symbols.target),
    })
  }

  return rows
}

export function formatEntityRelationRow(row: EntityRelationRow): string {
  return `${row.fromName} ${row.fromCard} -----> ${row.toCard} ${row.toName}`
}
