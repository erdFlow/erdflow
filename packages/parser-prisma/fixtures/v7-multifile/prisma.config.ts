import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: "postgresql://user:pass@localhost:5432/db",
  },
})
