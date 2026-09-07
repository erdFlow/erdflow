import assert from "node:assert/strict"
import test from "node:test"
import {
  createEntityId,
  createFieldId,
  createRelationId,
  type Relation,
} from "@erdflow/core"
import { EdgeKind } from "../../src/data/constants.js"
import { buildDisplayEdges } from "../../src/lib/diagram-display.js"
import type { RelationFlowEdge } from "../../src/types/flow-types.js"

function sampleEdge(overrides?: Partial<RelationFlowEdge>): RelationFlowEdge {
  const fromId = createEntityId("User")
  const toId = createEntityId("Post")
  const relation: Relation = {
    id: createRelationId("User", "Post", "id->userId"),
    from: { entityId: fromId, fieldIds: [createFieldId("User", "id")] },
    to: { entityId: toId, fieldIds: [createFieldId("Post", "userId")] },
    cardinality: "one-to-many",
  }

  return {
    id: relation.id,
    type: EdgeKind.RELATION,
    source: fromId,
    target: toId,
    data: {
      relation,
      label: "User To Post",
    },
    ...overrides,
  }
}

test("buildDisplayEdges preserves edge identity when style unchanged", () => {
  const edge = sampleEdge({
    hidden: false,
    style: { opacity: 1 },
  })
  const edges = [edge]
  const next = buildDisplayEdges(edges, [], "", null, true)
  assert.equal(next[0], edge)
})

test("buildDisplayEdges clones when opacity changes under focus", () => {
  const edge = sampleEdge({
    hidden: false,
    style: { opacity: 1 },
  })
  const focusSets = {
    nodeIds: new Set([edge.source]),
    edgeIds: new Set<string>(),
  }
  const next = buildDisplayEdges([edge], [], "", focusSets, true)
  assert.notEqual(next[0], edge)
  assert.equal(next[0]?.style?.opacity, 0.2)
  assert.equal(next[0]?.data?.label, "User To Post")
})

test("buildDisplayEdges hides all edges when showRelations is false", () => {
  const edge = sampleEdge({ hidden: false })
  const next = buildDisplayEdges([edge], [], "", null, false)
  assert.equal(next[0]?.hidden, true)
  assert.notEqual(next[0], edge)
})
