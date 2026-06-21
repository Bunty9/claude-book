import { describe, it, expect } from 'vitest'
import {
  ROOT_NODE_ID,
  TREE,
  getNode,
  answer,
  getRecommendation,
  resetState,
  type TreeState,
  type RecommendationId,
} from './decisionTree'

// ---------------------------------------------------------------------------
// getNode
// ---------------------------------------------------------------------------

describe('getNode', () => {
  it('returns the root node for ROOT_NODE_ID', () => {
    const node = getNode(ROOT_NODE_ID)
    if (node === undefined) throw new Error('root node must exist')
    expect(node.id).toBe(ROOT_NODE_ID)
    expect(node.kind).toBe('question')
  })

  it('returns undefined for an unknown id', () => {
    const node = getNode('__nonexistent__')
    expect(node).toBeUndefined()
  })

  it('every node referenced by a choice exists in TREE', () => {
    for (const node of Object.values(TREE)) {
      if (node.kind === 'question') {
        for (const choice of node.choices) {
          expect(
            getNode(choice.nextId),
            `choice "${choice.label}" -> "${choice.nextId}" not found`
          ).toBeDefined()
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// answer
// ---------------------------------------------------------------------------

describe('answer', () => {
  it('advances state from root to the chosen next node', () => {
    const root = getNode(ROOT_NODE_ID)
    if (root === undefined || root.kind !== 'question') throw new Error('root must be a question')
    const firstChoice = root.choices[0]
    if (firstChoice === undefined) throw new Error('root must have choices')

    const state: TreeState = { currentId: ROOT_NODE_ID, history: [] }
    const next = answer(state, firstChoice.nextId)
    expect(next.currentId).toBe(firstChoice.nextId)
    expect(next.history).toHaveLength(1)
    expect(next.history[0]).toEqual({ nodeId: ROOT_NODE_ID, chosenNextId: firstChoice.nextId })
  })

  it('does not mutate the original state', () => {
    const state: TreeState = { currentId: ROOT_NODE_ID, history: [] }
    const next = answer(state, getNode(ROOT_NODE_ID)?.kind === 'question'
      ? (getNode(ROOT_NODE_ID) as { choices: { nextId: string }[] }).choices[0]?.nextId ?? ROOT_NODE_ID
      : ROOT_NODE_ID
    )
    expect(state.history).toHaveLength(0)
    expect(next).not.toBe(state)
  })

  it('accumulates history across multiple answers', () => {
    let state: TreeState = { currentId: ROOT_NODE_ID, history: [] }

    // Walk the tree taking first choices until we hit a recommendation
    let steps = 0
    while (steps < 20) {
      const node = getNode(state.currentId)
      if (node === undefined || node.kind === 'recommendation') break
      const firstChoice = node.choices[0]
      if (firstChoice === undefined) break
      state = answer(state, firstChoice.nextId)
      steps++
    }

    expect(steps).toBeGreaterThan(0)
    expect(state.history).toHaveLength(steps)
  })
})

// ---------------------------------------------------------------------------
// resetState
// ---------------------------------------------------------------------------

describe('resetState', () => {
  it('returns state pointing at root with empty history', () => {
    const initial = resetState()
    expect(initial.currentId).toBe(ROOT_NODE_ID)
    expect(initial.history).toHaveLength(0)
  })

  it('produces a fresh object on each call', () => {
    const a = resetState()
    const b = resetState()
    expect(a).not.toBe(b)
    expect(a.history).not.toBe(b.history)
  })
})

// ---------------------------------------------------------------------------
// getRecommendation
// ---------------------------------------------------------------------------

describe('getRecommendation', () => {
  it('returns undefined when current node is a question', () => {
    const state = resetState()
    expect(getRecommendation(state)).toBeUndefined()
  })

  it('returns a recommendation when current node is a recommendation node', () => {
    // Walk first-choice path until we land on a recommendation
    let state = resetState()
    let steps = 0
    while (steps < 30) {
      const node = getNode(state.currentId)
      if (node === undefined) break
      if (node.kind === 'recommendation') break
      const firstChoice = node.choices[0]
      if (firstChoice === undefined) break
      state = answer(state, firstChoice.nextId)
      steps++
    }
    const rec = getRecommendation(state)
    expect(rec).toBeDefined()
    expect(rec?.id).toBeDefined()
  })

  it('every reachable leaf is a recommendation node with a non-empty title', () => {
    // BFS over all paths
    const visited = new Set<string>()
    const queue: string[] = [ROOT_NODE_ID]
    while (queue.length > 0) {
      const id = queue.shift()
      if (id === undefined || visited.has(id)) continue
      visited.add(id)
      const node = getNode(id)
      if (node === undefined) continue
      if (node.kind === 'question') {
        for (const choice of node.choices) {
          queue.push(choice.nextId)
        }
      } else {
        // recommendation leaf
        expect(node.title.length, `recommendation ${node.id} has empty title`).toBeGreaterThan(0)
        expect(node.body.length, `recommendation ${node.id} has empty body`).toBeGreaterThan(0)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Recommendation IDs — all known IDs map to existing nodes
// ---------------------------------------------------------------------------

describe('recommendation ids', () => {
  const EXPECTED_RECS: RecommendationId[] = [
    'use-subagent',
    'use-workflow',
    'use-hook',
    'use-skill',
    'use-mcp',
    'use-plain-prompt',
    'use-output-style',
  ]

  it('every expected recommendation id exists as a leaf node in the tree', () => {
    for (const recId of EXPECTED_RECS) {
      const node = getNode(recId)
      expect(node, `recommendation "${recId}" not found`).toBeDefined()
      expect(node?.kind).toBe('recommendation')
    }
  })
})

// ---------------------------------------------------------------------------
// Tree integrity — no orphan nodes, no cycles from root
// ---------------------------------------------------------------------------

describe('tree integrity', () => {
  it('has no orphan nodes (all nodes are reachable from root)', () => {
    const reachable = new Set<string>()
    const queue: string[] = [ROOT_NODE_ID]
    while (queue.length > 0) {
      const id = queue.shift()
      if (id === undefined || reachable.has(id)) continue
      reachable.add(id)
      const node = getNode(id)
      if (node?.kind === 'question') {
        for (const choice of node.choices) {
          queue.push(choice.nextId)
        }
      }
    }
    for (const id of Object.keys(TREE)) {
      expect(reachable.has(id), `node "${id}" is not reachable from root`).toBe(true)
    }
  })

  it('has no forward-reference cycles (tree is a DAG)', () => {
    // DFS cycle detection
    const WHITE = 0; const GRAY = 1; const BLACK = 2
    const color = new Map<string, number>()
    let hasCycle = false

    function dfs(id: string): void {
      color.set(id, GRAY)
      const node = getNode(id)
      if (node?.kind === 'question') {
        for (const choice of node.choices) {
          const c = color.get(choice.nextId) ?? WHITE
          if (c === GRAY) { hasCycle = true; return }
          if (c === WHITE) dfs(choice.nextId)
        }
      }
      color.set(id, BLACK)
    }

    dfs(ROOT_NODE_ID)
    expect(hasCycle).toBe(false)
  })
})
