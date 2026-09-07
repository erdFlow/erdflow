/** Generate a Prisma schema string with N chained models for size benches. */
export function generateSizedPrismaSchema(entityCount: number): string {
  if (!Number.isInteger(entityCount) || entityCount < 1) {
    throw new Error(
      `entityCount must be a positive integer, got ${entityCount}`
    )
  }

  const header = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`

  if (entityCount === 1) {
    return `${header}
model Table0 {
  id   Int    @id @default(autoincrement())
  name String
}
`
  }

  const models: string[] = []
  for (let i = 0; i < entityCount; i += 1) {
    const name = `Table${i}`
    if (i === 0) {
      models.push(`model ${name} {
  id       Int      @id @default(autoincrement())
  name     String
  children Table1[]
}
`)
      continue
    }

    const parent = `Table${i - 1}`
    const childLine = i < entityCount - 1 ? `\n  children Table${i + 1}[]` : ""
    models.push(`model ${name} {
  id       Int    @id @default(autoincrement())
  name     String
  parentId Int
  parent   ${parent} @relation(fields: [parentId], references: [id])${childLine}
}
`)
  }

  return `${header}\n${models.join("\n")}`
}
