import assert from "node:assert/strict"
import test from "node:test"
import { createEntityId, createEnumId, createIndexId } from "@erdflow/core"
import { dbmlAdapter } from "@erdflow/parser-dbml"
import {
  printCliError,
  printDetectionSummary,
  printParseError,
  printUnsupportedProject,
} from "../src/output.js"
import type { ResolvedSource } from "../src/scan.js"

test("printDetectionSummary includes entity, enum, relation, and index counts", () => {
  const logs: string[] = []
  const original = console.log
  console.log = (...args: unknown[]) => logs.push(args.join(" "))

  try {
    const source: ResolvedSource = {
      adapter: dbmlAdapter,
      adapterName: "dbml",
      filePath: "/tmp/schema.dbml",
      watchPaths: ["/tmp/schema.dbml"],
    }
    const schema = {
      entities: [
        {
          id: createEntityId("users"),
          name: "users",
          kind: "table" as const,
          fields: [],
        },
      ],
      enums: [
        { id: createEnumId("status"), name: "status", values: ["active"] },
      ],
      relations: [],
      indexes: [
        {
          id: createIndexId("users", "email"),
          name: "idx",
          entityId: createEntityId("users"),
          fieldIds: [],
          unique: false,
        },
      ],
      constraints: [],
    }

    printDetectionSummary("/tmp", source, schema, "http://127.0.0.1:4317/", [
      "Prisma",
    ])

    const output = logs.join("\n")
    assert.match(output, /Detected DBML/)
    assert.match(output, /schema\.dbml/)
    assert.match(output, /1 entities · 1 enums · 0 relations · 1 indexes/)
    assert.match(output, /127\.0\.0\.1:4317/)
    assert.match(output, /package\.json hints: Prisma/)
  } finally {
    console.log = original
  }
})

test("printUnsupportedProject writes supported format hints", () => {
  const errors: string[] = []
  const original = console.error
  console.error = (...args: unknown[]) => errors.push(args.join(" "))

  try {
    printUnsupportedProject("No schema source found.")
    const output = errors.join("\n")
    assert.match(output, /No schema source found/)
    assert.match(output, /Prisma/)
    assert.match(output, /DBML/)
    assert.match(output, /SQL/)
  } finally {
    console.error = original
  }
})

test("printParseError includes file path and message", () => {
  const errors: string[] = []
  const original = console.error
  console.error = (...args: unknown[]) => errors.push(args.join(" "))

  try {
    printParseError("/tmp/bad.dbml", "Unexpected token")
    const output = errors.join("\n")
    assert.match(output, /Schema parse error/)
    assert.match(output, /bad\.dbml/)
    assert.match(output, /Unexpected token/)
  } finally {
    console.error = original
  }
})

test("printCliError routes unsupported project messages", () => {
  const errors: string[] = []
  const original = console.error
  console.error = (...args: unknown[]) => errors.push(args.join(" "))

  try {
    printCliError(
      new Error("No schema source found. Supported formats: Prisma.")
    )
    const output = errors.join("\n")
    assert.match(output, /Supported formats/)
    assert.doesNotMatch(output, /^✗ No schema source found\n {2}✗/)
  } finally {
    console.error = original
  }
})
