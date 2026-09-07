import type { SchemaGraph } from "./graph.js"

export interface GraphMetrics {
  deg: Map<string, number>
  medianDeg: number
  hubs: Set<string>
  leaves: Set<string>
  density: number
  components: number
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const upper = sorted[mid]
  if (upper === undefined) {
    return 0
  }
  if (sorted.length % 2 === 1) {
    return upper
  }
  const lower = sorted[mid - 1]
  if (lower === undefined) {
    return upper
  }
  return (lower + upper) / 2
}

function countComponents(neighbors: Map<string, Set<string>>): number {
  const ids = [...neighbors.keys()]
  if (ids.length === 0) {
    return 0
  }

  const parent = new Map<string, string>()
  for (const id of ids) {
    parent.set(id, id)
  }

  function find(id: string): string {
    let current = id
    while (parent.get(current) !== current) {
      const next = parent.get(current)
      if (next === undefined) {
        return current
      }
      current = next
    }
    return current
  }

  function union(a: string, b: string): void {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) {
      parent.set(rootA, rootB)
    }
  }

  for (const [id, offs] of neighbors) {
    for (const other of offs) {
      union(id, other)
    }
  }

  const roots = new Set<string>()
  for (const id of ids) {
    roots.add(find(id))
  }
  return roots.size
}

/**
 * Degree / hub / leaf metrics over entity adjacency.
 * Hub: deg > max(3 * medianDeg, 6). Leaf: deg === 1.
 */
export function measureGraph(graph: SchemaGraph): GraphMetrics {
  const deg = new Map<string, number>()
  let edgeCount = 0

  for (const [id, offs] of graph.neighbors) {
    deg.set(id, offs.size)
    edgeCount += offs.size
  }
  // Each undirected edge counted twice in the walk above.
  const undirectedEdgeCount = edgeCount / 2
  const vertexCount = graph.neighbors.size

  const degrees = [...deg.values()]
  const medianDeg = median(degrees)
  const hubThreshold = Math.max(3 * medianDeg, 6)

  const hubs = new Set<string>()
  const leaves = new Set<string>()
  for (const [id, degree] of deg) {
    if (degree > hubThreshold) {
      hubs.add(id)
    }
    if (degree === 1) {
      leaves.add(id)
    }
  }

  return {
    deg,
    medianDeg,
    hubs,
    leaves,
    density: vertexCount === 0 ? 0 : undirectedEdgeCount / vertexCount,
    components: countComponents(graph.neighbors),
  }
}
