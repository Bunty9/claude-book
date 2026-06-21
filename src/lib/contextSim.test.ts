import { describe, it, expect } from 'vitest'
import {
  PRESETS,
  buildSession,
  computeFill,
  compactionThreshold,
  type SimTurn,
} from './contextSim'

// ── buildSession ────────────────────────────────────────────────────────────

describe('buildSession', () => {
  it('returns an empty session when turns is 0 (only system tokens remain)', () => {
    const preset = PRESETS.lean
    const session = buildSession('lean', 0)
    expect(session.turns).toHaveLength(0)
    // totalTokens = systemTokens even with no turns
    expect(session.totalTokens).toBe(preset.systemTokens)
  })

  it('includes system tokens in total even with 0 turns', () => {
    const preset = PRESETS.lean
    const session = buildSession('lean', 0)
    // systemTokens are part of the baseline but NOT in turns[]
    expect(session.systemTokens).toBe(preset.systemTokens)
  })

  it('produces the correct number of turns', () => {
    const session = buildSession('lean', 5)
    expect(session.turns).toHaveLength(5)
  })

  it('each turn has a positive tokenCost', () => {
    const session = buildSession('lean', 4)
    for (const turn of session.turns) {
      expect(turn.tokenCost).toBeGreaterThan(0)
    }
  })

  it('totalTokens equals systemTokens plus sum of turn costs', () => {
    const session = buildSession('bloated', 6)
    const turnSum = session.turns.reduce((acc, t) => acc + t.tokenCost, 0)
    expect(session.totalTokens).toBe(session.systemTokens + turnSum)
  })

  it('lean preset produces fewer tokens than bloated for equal turns', () => {
    const lean = buildSession('lean', 8)
    const bloated = buildSession('bloated', 8)
    expect(lean.totalTokens).toBeLessThan(bloated.totalTokens)
  })

  it('turns are labelled with sequential indices', () => {
    const session = buildSession('lean', 3)
    expect(session.turns[0].index).toBe(0)
    expect(session.turns[1].index).toBe(1)
    expect(session.turns[2].index).toBe(2)
  })

  it('turns alternate between user and assistant roles', () => {
    const session = buildSession('lean', 4)
    const roles = session.turns.map(t => t.role)
    expect(roles[0]).toBe('user')
    expect(roles[1]).toBe('assistant')
    expect(roles[2]).toBe('user')
    expect(roles[3]).toBe('assistant')
  })

  it('bloated preset includes file-read or search turns (tool results)', () => {
    // bloated pattern has file-read and search kinds; lean has none
    const session = buildSession('bloated', 10)
    const hasToolResult = session.turns.some(
      t => t.kind === 'file-read' || t.kind === 'search',
    )
    expect(hasToolResult).toBe(true)
  })

  it('lean preset has no file-read or search turns', () => {
    const session = buildSession('lean', 10)
    const hasToolResult = session.turns.some(
      t => t.kind === 'file-read' || t.kind === 'search',
    )
    expect(hasToolResult).toBe(false)
  })
})

// ── computeFill ─────────────────────────────────────────────────────────────

describe('computeFill', () => {
  it('returns 0 when totalTokens is 0', () => {
    expect(computeFill(0, 200_000)).toBe(0)
  })

  it('returns a value between 0 and 1 (inclusive)', () => {
    const f = computeFill(50_000, 200_000)
    expect(f).toBeGreaterThanOrEqual(0)
    expect(f).toBeLessThanOrEqual(1)
  })

  it('returns 1 when totalTokens equals budget', () => {
    expect(computeFill(100_000, 100_000)).toBe(1)
  })

  it('is clamped to 1 if totalTokens exceeds budget', () => {
    expect(computeFill(300_000, 100_000)).toBe(1)
  })

  it('is proportional to the ratio', () => {
    expect(computeFill(25_000, 100_000)).toBeCloseTo(0.25)
    expect(computeFill(75_000, 100_000)).toBeCloseTo(0.75)
  })
})

// ── compactionThreshold ──────────────────────────────────────────────────────

describe('compactionThreshold', () => {
  it('returns a value between 0 and 1', () => {
    const t = compactionThreshold()
    expect(t).toBeGreaterThan(0)
    expect(t).toBeLessThan(1)
  })

  it('is the same constant on every call', () => {
    expect(compactionThreshold()).toBe(compactionThreshold())
  })

  it('is above 0.5 — compaction happens in the upper half', () => {
    expect(compactionThreshold()).toBeGreaterThan(0.5)
  })
})

// ── PRESETS ─────────────────────────────────────────────────────────────────

describe('PRESETS', () => {
  it('exports lean and bloated', () => {
    expect(PRESETS).toHaveProperty('lean')
    expect(PRESETS).toHaveProperty('bloated')
  })

  it('lean has lower systemTokens than bloated', () => {
    expect(PRESETS.lean.systemTokens).toBeLessThan(PRESETS.bloated.systemTokens)
  })

  it('each preset has a non-empty label', () => {
    for (const p of Object.values(PRESETS)) {
      expect(typeof p.label).toBe('string')
      expect(p.label.length).toBeGreaterThan(0)
    }
  })

  it('each preset has a non-empty description', () => {
    for (const p of Object.values(PRESETS)) {
      expect(typeof p.description).toBe('string')
      expect(p.description.length).toBeGreaterThan(0)
    }
  })
})

// ── SimTurn type-shape guard ─────────────────────────────────────────────────

describe('SimTurn shape', () => {
  it('each turn produced by buildSession satisfies the SimTurn shape', () => {
    const session = buildSession('bloated', 6)
    for (const turn of session.turns) {
      const t: SimTurn = turn
      expect(typeof t.index).toBe('number')
      expect(['user', 'assistant', 'tool-result']).toContain(t.role)
      expect(['message', 'tool-result', 'file-read', 'search']).toContain(t.kind)
      expect(typeof t.tokenCost).toBe('number')
      expect(typeof t.label).toBe('string')
    }
  })
})
