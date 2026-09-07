import type { Field, IdStrategy, UniversalSchema } from "@erdflow/core"
import { resolveIdStrategy } from "../data/field-pills.js"

function displayType(field: Field): string {
  if (field.type.native === "ObjectId" || field.idStrategy === "objectId") {
    return field.type.isArray ? "ObjectId[]" : "ObjectId"
  }
  const base = field.type.native ?? field.type.name
  return field.type.isArray ? `${base}[]` : base
}

function strategyNote(strategy: IdStrategy | undefined): string | null {
  switch (strategy) {
    case "objectId":
    case "auto":
      return "@default(auto())"
    case "uuid":
      return "@default(uuid())"
    case "cuid":
      return "@default(cuid())"
    case "nanoid":
      return "@default(nanoid())"
    case "autoincrement":
      return "@default(autoincrement())"
    default:
      return null
  }
}

/**
 * Document-oriented schema dump for MongoDB / collection entities.
 * Not SQL — mirrors Prisma field annotations the user already knows.
 */
export function entityToDocument(
  schema: UniversalSchema,
  entityId: string
): string | null {
  const entity = schema.entities.find((entry) => entry.id === entityId)
  if (!entity) {
    return null
  }

  const lines: string[] = [`// collection: ${entity.name}`, "{"]

  for (const field of entity.fields) {
    const strategy = resolveIdStrategy(field)
    const flags: string[] = []
    if (field.isPrimaryKey) {
      flags.push(field.name === "id" ? "_id" : "pk")
    }
    if (field.isUnique && !field.isPrimaryKey) {
      flags.push("unique")
    }
    if (!field.nullable) {
      flags.push("required")
    }
    const note = strategyNote(strategy)
    if (note) {
      flags.push(note)
    } else if (field.default) {
      flags.push(`default=${field.default}`)
    }

    const suffix = flags.length > 0 ? `  // ${flags.join(", ")}` : ""
    lines.push(`  ${field.name}: ${displayType(field)},${suffix}`)
  }

  lines.push("}")

  // Related collections (outgoing relation targets).
  const targets = schema.relations
    .filter(
      (relation) =>
        relation.from.entityId === entity.id ||
        relation.to.entityId === entity.id
    )
    .map((relation) => {
      const otherId =
        relation.from.entityId === entity.id
          ? relation.to.entityId
          : relation.from.entityId
      return schema.entities.find((entry) => entry.id === otherId)?.name
    })
    .filter((name): name is string => Boolean(name))

  const uniqueTargets = [...new Set(targets)]
  if (uniqueTargets.length > 0) {
    lines.push("")
    lines.push("// relations")
    for (const name of uniqueTargets) {
      lines.push(`// → ${name}`)
    }
  }

  return lines.join("\n")
}
