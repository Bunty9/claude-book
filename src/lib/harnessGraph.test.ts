import { describe, it, expect } from 'vitest'
import {
  HARNESS_NODES,
  HARNESS_EDGES,
  HARNESS_GRAPH,
  findNode,
  edgesFrom,
  edgesTo,
  loopEdges,
  canReach,
  type NodeId,
} from './harnessGraph'

// ---------------------------------------------------------------------------
// Structure tests
// ---------------------------------------------------------------------------

describe('HARNESS_NODES', () => {
  it('contains exactly six nodes', () => {
    expect(HARNESS_NODES).toHaveLength(6)
  })

  it('includes all expected node ids', () => {
    const ids = HARNESS_NODES.map(n => n.id)
    const expected: NodeId[] = [
      'context',
      'model',
      'tool-call',
      'tool-result',
      'loop-check',
      'result',
    ]
    expect(ids).toEqual(expect.arrayContaining(expected))
    expect(expected).toEqual(expect.arrayContaining(ids))
  })

  it('every node has a non-empty label, summary, and description', () => {
    for (const node of HARNESS_NODES) {
      expect(node.label.trim().length).toBeGreaterThan(0)
      expect(node.summary.trim().length).toBeGreaterThan(0)
      expect(node.description.trim().length).toBeGreaterThan(0)
    }
  })

  it('every node role is one of the five valid token roles', () => {
    const validRoles = new Set(['surface', 'accent', 'tip', 'warning', 'note'])
    for (const node of HARNESS_NODES) {
      expect(validRoles.has(node.role)).toBe(true)
    }
  })

  it('node ids are unique', () => {
    const ids = HARNESS_NODES.map(n => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ---------------------------------------------------------------------------
// Edge tests
// ---------------------------------------------------------------------------

describe('HARNESS_EDGES', () => {
  it('has at least seven edges', () => {
    expect(HARNESS_EDGES.length).toBeGreaterThanOrEqual(7)
  })

  it('every edge references valid node ids', () => {
    const ids = new Set(HARNESS_NODES.map(n => n.id))
    for (const edge of HARNESS_EDGES) {
      expect(ids.has(edge.from)).toBe(true)
      expect(ids.has(edge.to)).toBe(true)
    }
  })

  it('every edge has a non-empty label', () => {
    for (const edge of HARNESS_EDGES) {
      expect(edge.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('the model→result edge is not marked as a loop', () => {
    const edge = HARNESS_EDGES.find(e => e.from === 'model' && e.to === 'result')
    expect(edge).toBeDefined()
    expect(edge?.isLoop).toBe(false)
  })

  it('the loop-check→context edge is marked as a loop', () => {
    const edge = HARNESS_EDGES.find(e => e.from === 'loop-check' && e.to === 'context')
    expect(edge).toBeDefined()
    expect(edge?.isLoop).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// HARNESS_GRAPH composed export
// ---------------------------------------------------------------------------

describe('HARNESS_GRAPH', () => {
  it('exposes the same nodes and edges arrays', () => {
    expect(HARNESS_GRAPH.nodes).toBe(HARNESS_NODES)
    expect(HARNESS_GRAPH.edges).toBe(HARNESS_EDGES)
  })
})

// ---------------------------------------------------------------------------
// findNode helper
// ---------------------------------------------------------------------------

describe('findNode', () => {
  it('returns the correct node for a known id', () => {
    const node = findNode('model')
    expect(node).toBeDefined()
    expect(node?.id).toBe('model')
    expect(node?.label).toBe('Model Inference')
  })

  it('returns undefined for an unknown id', () => {
    // Cast to satisfy TS — we want to verify runtime safety
    expect(findNode('nonexistent' as NodeId)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// edgesFrom helper
// ---------------------------------------------------------------------------

describe('edgesFrom', () => {
  it('returns edges where from === id', () => {
    const edges = edgesFrom('model')
    expect(edges.length).toBeGreaterThanOrEqual(2)
    for (const e of edges) {
      expect(e.from).toBe('model')
    }
  })

  it('context node has outgoing edge to model', () => {
    const edges = edgesFrom('context')
    expect(edges.some(e => e.to === 'model')).toBe(true)
  })

  it('result node has no outgoing edges (terminal)', () => {
    expect(edgesFrom('result')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// edgesTo helper
// ---------------------------------------------------------------------------

describe('edgesTo', () => {
  it('returns edges where to === id', () => {
    const edges = edgesTo('result')
    expect(edges.length).toBeGreaterThanOrEqual(2)
    for (const e of edges) {
      expect(e.to).toBe('result')
    }
  })

  it('context is reachable from loop-check', () => {
    const edges = edgesTo('context')
    expect(edges.some(e => e.from === 'loop-check')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// loopEdges helper
// ---------------------------------------------------------------------------

describe('loopEdges', () => {
  it('returns only edges marked isLoop', () => {
    const loops = loopEdges()
    expect(loops.length).toBeGreaterThan(0)
    for (const e of loops) {
      expect(e.isLoop).toBe(true)
    }
  })

  it('includes the loop-check→context back-edge', () => {
    const loops = loopEdges()
    expect(loops.some(e => e.from === 'loop-check' && e.to === 'context')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// canReach helper
// ---------------------------------------------------------------------------

describe('canReach', () => {
  it('a node can always reach itself', () => {
    expect(canReach('context', 'context')).toBe(true)
    expect(canReach('result', 'result')).toBe(true)
  })

  it('context eventually reaches result (happy path)', () => {
    expect(canReach('context', 'result')).toBe(true)
  })

  it('model can reach tool-result via tool-call', () => {
    expect(canReach('model', 'tool-result')).toBe(true)
  })

  it('loop-check can reach model (via loop back to context)', () => {
    expect(canReach('loop-check', 'model')).toBe(true)
  })

  it('result cannot reach context (terminal node)', () => {
    expect(canReach('result', 'context')).toBe(false)
  })

  it('tool-result can reach result via loop-check', () => {
    expect(canReach('tool-result', 'result')).toBe(true)
  })
})
