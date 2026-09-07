import assert from "node:assert/strict"
import test from "node:test"
import { createEntityId, createEnumId, createIndexId } from "@erdflow/core"
import { prismaAdapter } from "@erdflow/parser-prisma"
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
      adapter: prismaAdapter,
      adapterName: "prisma",
      filePath: "/tmp/schema.prisma",
      watchPaths: ["/tmp/schema.prisma"],
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
    assert.match(output, /Detected Prisma/)
    assert.match(output, /schema\.prisma/)
    assert.match(output, /1 entities · 1 enums · 0 relations · 1 indexes/)
    assert.match(output, /127\.0\.0\.1:4317/)
    assert.match(output, /package\.json hints: Prisma/)
  } finally {
    console.log = original
  }
})

test("printUnsupportedProject writes Prisma-only hints", () => {
  const errors: string[] = []
  const original = console.error
  console.error = (...args: unknown[]) => errors.push(args.join(" "))

  try {
    printUnsupportedProject("No schema source found.")
    const output = errors.join("\n")
    assert.match(output, /No schema source found/)
    assert.match(output, /Prisma/)
    assert.doesNotMatch(output, /DBML/)
    assert.doesNotMatch(output, /\bSQL\b/)
  } finally {
    console.error = original
  }
})

test("printParseError includes file path and message", () => {
  const errors: string[] = []
  const original = console.error
  console.error = (...args: unknown[]) => errors.push(args.join(" "))

  try {
    printParseError("/tmp/bad.prisma", "Unexpected token")
    const output = errors.join("\n")
    assert.match(output, /Schema parse error/)
    assert.match(output, /bad\.prisma/)
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
    printCliError(new Error("No schema source found. Expected Prisma."))
    const output = errors.join("\n")
    assert.match(output, /Supported/)
    assert.doesNotMatch(output, /^✗ No schema source found\n {2}✗/)
  } finally {
    console.error = original
  }
})
