import { describe, it, expect } from 'vitest'
import {
  TDD_PHASES,
  TDD_TRANSITIONS,
  TDD_LOOP,
  findPhase,
  nextTransition,
  prevTransition,
  nextPhase,
  prevPhase,
  cycleFrom,
  agentLoadPercent,
  type PhaseId,
} from './tddLoop'

// ---------------------------------------------------------------------------
// TDD_PHASES structure
// ---------------------------------------------------------------------------

describe('TDD_PHASES', () => {
  it('contains exactly three phases', () => {
    expect(TDD_PHASES).toHaveLength(3)
  })

  it('includes red, green, and refactor ids in that order', () => {
    const ids = TDD_PHASES.map(p => p.id)
    expect(ids).toEqual(['red', 'green', 'refactor'])
  })

  it('every phase has non-empty label, goal, description, humanRole', () => {
    for (const phase of TDD_PHASES) {
      expect(phase.label.trim().length).toBeGreaterThan(0)
      expect(phase.goal.trim().length).toBeGreaterThan(0)
      expect(phase.description.trim().length).toBeGreaterThan(0)
      expect(phase.humanRole.trim().length).toBeGreaterThan(0)
    }
  })

  it('every phase has a valid role token', () => {
    const validRoles = new Set(['danger', 'tip', 'accent', 'warning', 'note', 'surface'])
    for (const phase of TDD_PHASES) {
      expect(validRoles.has(phase.role)).toBe(true)
    }
  })

  it('red phase has role "danger" (failing test)', () => {
    const red = TDD_PHASES.find(p => p.id === 'red')
    expect(red?.role).toBe('danger')
  })

  it('green phase has role "tip" (passing)', () => {
    const green = TDD_PHASES.find(p => p.id === 'green')
    expect(green?.role).toBe('tip')
  })

  it('refactor phase has role "accent"', () => {
    const refactor = TDD_PHASES.find(p => p.id === 'refactor')
    expect(refactor?.role).toBe('accent')
  })

  it('every phase has an agentRole with non-empty action and at least one example', () => {
    for (const phase of TDD_PHASES) {
      expect(phase.agentRole.action.trim().length).toBeGreaterThan(0)
      expect(phase.agentRole.examples.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('agentLoad is a number between 0 and 1 (inclusive)', () => {
    for (const phase of TDD_PHASES) {
      expect(phase.agentRole.agentLoad).toBeGreaterThanOrEqual(0)
      expect(phase.agentRole.agentLoad).toBeLessThanOrEqual(1)
    }
  })

  it('every phase artefact has non-empty label and note', () => {
    for (const phase of TDD_PHASES) {
      expect(phase.artefact.label.trim().length).toBeGreaterThan(0)
      expect(phase.artefact.note.trim().length).toBeGreaterThan(0)
    }
  })

  it('phase ids are unique', () => {
    const ids = TDD_PHASES.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ---------------------------------------------------------------------------
// TDD_TRANSITIONS structure
// ---------------------------------------------------------------------------

describe('TDD_TRANSITIONS', () => {
  it('contains exactly three transitions', () => {
    expect(TDD_TRANSITIONS).toHaveLength(3)
  })

  it('transitions cover red→green, green→refactor, refactor→red', () => {
    const pairs = TDD_TRANSITIONS.map(t => `${t.from}→${t.to}`)
    expect(pairs).toContain('red→green')
    expect(pairs).toContain('green→refactor')
    expect(pairs).toContain('refactor→red')
  })

  it('every transition references valid phase ids', () => {
    const validIds = new Set<PhaseId>(['red', 'green', 'refactor'])
    for (const t of TDD_TRANSITIONS) {
      expect(validIds.has(t.from)).toBe(true)
      expect(validIds.has(t.to)).toBe(true)
    }
  })

  it('every transition has a non-empty condition', () => {
    for (const t of TDD_TRANSITIONS) {
      expect(t.condition.trim().length).toBeGreaterThan(0)
    }
  })

  it('no transition is a self-loop (from === to)', () => {
    for (const t of TDD_TRANSITIONS) {
      expect(t.from).not.toBe(t.to)
    }
  })
})

// ---------------------------------------------------------------------------
// TDD_LOOP composed export
// ---------------------------------------------------------------------------

describe('TDD_LOOP', () => {
  it('exposes the same phases and transitions arrays', () => {
    expect(TDD_LOOP.phases).toBe(TDD_PHASES)
    expect(TDD_LOOP.transitions).toBe(TDD_TRANSITIONS)
  })
})

// ---------------------------------------------------------------------------
// findPhase
// ---------------------------------------------------------------------------

describe('findPhase', () => {
  it('returns the red phase for id "red"', () => {
    const phase = findPhase('red')
    expect(phase).toBeDefined()
    expect(phase?.id).toBe('red')
    expect(phase?.label).toBe('Red')
  })

  it('returns the green phase for id "green"', () => {
    const phase = findPhase('green')
    expect(phase?.id).toBe('green')
  })

  it('returns the refactor phase for id "refactor"', () => {
    const phase = findPhase('refactor')
    expect(phase?.id).toBe('refactor')
  })

  it('returns undefined for an unknown id (runtime safety)', () => {
    expect(findPhase('unknown' as PhaseId)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// nextTransition
// ---------------------------------------------------------------------------

describe('nextTransition', () => {
  it('red → green transition exists', () => {
    const t = nextTransition('red')
    expect(t).toBeDefined()
    expect(t?.to).toBe('green')
  })

  it('green → refactor transition exists', () => {
    const t = nextTransition('green')
    expect(t?.to).toBe('refactor')
  })

  it('refactor → red transition exists (cycle closes)', () => {
    const t = nextTransition('refactor')
    expect(t?.to).toBe('red')
  })
})

// ---------------------------------------------------------------------------
// prevTransition
// ---------------------------------------------------------------------------

describe('prevTransition', () => {
  it('arriving at green came from red', () => {
    const t = prevTransition('green')
    expect(t?.from).toBe('red')
  })

  it('arriving at refactor came from green', () => {
    const t = prevTransition('refactor')
    expect(t?.from).toBe('green')
  })

  it('arriving at red came from refactor', () => {
    const t = prevTransition('red')
    expect(t?.from).toBe('refactor')
  })
})

// ---------------------------------------------------------------------------
// nextPhase
// ---------------------------------------------------------------------------

describe('nextPhase', () => {
  it('red advances to green', () => {
    expect(nextPhase('red')).toBe('green')
  })

  it('green advances to refactor', () => {
    expect(nextPhase('green')).toBe('refactor')
  })

  it('refactor wraps back to red', () => {
    expect(nextPhase('refactor')).toBe('red')
  })

  it('three successive advances return to the start', () => {
    const start: PhaseId = 'red'
    const after = nextPhase(nextPhase(nextPhase(start)))
    expect(after).toBe(start)
  })
})

// ---------------------------------------------------------------------------
// prevPhase
// ---------------------------------------------------------------------------

describe('prevPhase', () => {
  it('green retreats to red', () => {
    expect(prevPhase('green')).toBe('red')
  })

  it('refactor retreats to green', () => {
    expect(prevPhase('refactor')).toBe('green')
  })

  it('red retreats to refactor (wraps)', () => {
    expect(prevPhase('red')).toBe('refactor')
  })
})

// ---------------------------------------------------------------------------
// cycleFrom
// ---------------------------------------------------------------------------

describe('cycleFrom', () => {
  it('starting from red returns [red, green, refactor]', () => {
    expect(cycleFrom('red')).toEqual(['red', 'green', 'refactor'])
  })

  it('starting from green returns [green, refactor, red]', () => {
    expect(cycleFrom('green')).toEqual(['green', 'refactor', 'red'])
  })

  it('starting from refactor returns [refactor, red, green]', () => {
    expect(cycleFrom('refactor')).toEqual(['refactor', 'red', 'green'])
  })

  it('always returns exactly three elements', () => {
    for (const id of ['red', 'green', 'refactor'] as PhaseId[]) {
      expect(cycleFrom(id)).toHaveLength(3)
    }
  })

  it('contains all three phases regardless of start', () => {
    for (const id of ['red', 'green', 'refactor'] as PhaseId[]) {
      const cycle = cycleFrom(id)
      expect(cycle).toContain('red')
      expect(cycle).toContain('green')
      expect(cycle).toContain('refactor')
    }
  })
})

// ---------------------------------------------------------------------------
// agentLoadPercent
// ---------------------------------------------------------------------------

describe('agentLoadPercent', () => {
  it('returns a value between 0 and 100 for each phase', () => {
    for (const id of ['red', 'green', 'refactor'] as PhaseId[]) {
      const pct = agentLoadPercent(id)
      expect(pct).toBeGreaterThanOrEqual(0)
      expect(pct).toBeLessThanOrEqual(100)
    }
  })

  it('returns 0 for an unknown id', () => {
    expect(agentLoadPercent('unknown' as PhaseId)).toBe(0)
  })

  it('green phase has the highest agent load (implementation is highly automatable)', () => {
    const redPct     = agentLoadPercent('red')
    const greenPct   = agentLoadPercent('green')
    const refactPct  = agentLoadPercent('refactor')
    expect(greenPct).toBeGreaterThanOrEqual(redPct)
    expect(greenPct).toBeGreaterThanOrEqual(refactPct)
  })

  it('returns an integer (no decimal places)', () => {
    for (const id of ['red', 'green', 'refactor'] as PhaseId[]) {
      const pct = agentLoadPercent(id)
      expect(Number.isInteger(pct)).toBe(true)
    }
  })
})
