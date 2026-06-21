import { describe, it, expect } from 'vitest'
import {
  WORKTREE_STEPS,
  STEP_COUNT,
  STEP_IDS,
  stepAt,
  indexOfStep,
  advance,
  retreat,
  jumpTo,
  isFirst,
  isLast,
  initialFlowState,
  progressLabel,
  type FlowState,
  type StepId,
} from './worktreeFlow'

// ---------------------------------------------------------------------------
// Static data integrity
// ---------------------------------------------------------------------------

describe('WORKTREE_STEPS', () => {
  it('has at least 5 steps', () => {
    expect(WORKTREE_STEPS.length).toBeGreaterThanOrEqual(5)
  })

  it('every step has a non-empty id, title, summary, description, and role', () => {
    for (const step of WORKTREE_STEPS) {
      expect(step.id.length).toBeGreaterThan(0)
      expect(step.title.length).toBeGreaterThan(0)
      expect(step.summary.length).toBeGreaterThan(0)
      expect(step.description.length).toBeGreaterThan(0)
      expect(step.role.length).toBeGreaterThan(0)
    }
  })

  it('all ids are unique', () => {
    const ids = WORKTREE_STEPS.map(s => s.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('STEP_COUNT matches WORKTREE_STEPS.length', () => {
    expect(STEP_COUNT).toBe(WORKTREE_STEPS.length)
  })

  it('STEP_IDS contains all step ids in order', () => {
    expect(STEP_IDS).toEqual(WORKTREE_STEPS.map(s => s.id))
  })

  it('includes the detached-main step as the first step', () => {
    expect(WORKTREE_STEPS[0]?.id).toBe('detached-main')
  })

  it('includes the cleanup step as the last step', () => {
    const last = WORKTREE_STEPS[WORKTREE_STEPS.length - 1]
    expect(last?.id).toBe('cleanup')
  })

  it('create-worktree step has a non-null command', () => {
    const step = WORKTREE_STEPS.find(s => s.id === 'create-worktree')
    expect(step?.command).not.toBeNull()
    expect(typeof step?.command).toBe('string')
  })

  it('detached-main step has no command (null)', () => {
    const step = WORKTREE_STEPS.find(s => s.id === 'detached-main')
    expect(step?.command).toBeNull()
  })

  it('cleanup step has no pitfall (null)', () => {
    const step = WORKTREE_STEPS.find(s => s.id === 'cleanup')
    expect(step?.pitfall).toBeNull()
  })

  it('commit step has a pitfall', () => {
    const step = WORKTREE_STEPS.find(s => s.id === 'commit')
    expect(step?.pitfall).not.toBeNull()
    expect(typeof step?.pitfall).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// stepAt
// ---------------------------------------------------------------------------

describe('stepAt', () => {
  it('returns the first step at index 0', () => {
    const step = stepAt(0)
    expect(step?.id).toBe('detached-main')
  })

  it('returns the correct step at each valid index', () => {
    for (let i = 0; i < STEP_COUNT; i++) {
      const step = stepAt(i)
      expect(step).toBe(WORKTREE_STEPS[i])
    }
  })

  it('returns undefined for negative index', () => {
    expect(stepAt(-1)).toBeUndefined()
  })

  it('returns undefined for out-of-range index', () => {
    expect(stepAt(STEP_COUNT)).toBeUndefined()
    expect(stepAt(9999)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// indexOfStep
// ---------------------------------------------------------------------------

describe('indexOfStep', () => {
  it('returns 0 for detached-main', () => {
    expect(indexOfStep('detached-main')).toBe(0)
  })

  it('returns STEP_COUNT - 1 for cleanup', () => {
    expect(indexOfStep('cleanup')).toBe(STEP_COUNT - 1)
  })

  it('returns -1 for an id not in the list', () => {
    // Cast as StepId to satisfy type; the function must still return -1 at runtime.
    expect(indexOfStep('nonexistent' as StepId)).toBe(-1)
  })

  it('round-trips: stepAt(indexOfStep(id)).id === id for every step', () => {
    for (const step of WORKTREE_STEPS) {
      const idx = indexOfStep(step.id)
      expect(stepAt(idx)?.id).toBe(step.id)
    }
  })
})

// ---------------------------------------------------------------------------
// initialFlowState
// ---------------------------------------------------------------------------

describe('initialFlowState', () => {
  it('starts at index 0', () => {
    expect(initialFlowState().currentIndex).toBe(0)
  })

  it('totalSteps equals STEP_COUNT', () => {
    expect(initialFlowState().totalSteps).toBe(STEP_COUNT)
  })
})

// ---------------------------------------------------------------------------
// advance
// ---------------------------------------------------------------------------

describe('advance', () => {
  it('increments currentIndex by 1 from the first step', () => {
    const s0 = initialFlowState()
    const s1 = advance(s0)
    expect(s1.currentIndex).toBe(1)
  })

  it('does not advance past the last step', () => {
    const last: FlowState = { currentIndex: STEP_COUNT - 1, totalSteps: STEP_COUNT }
    const still = advance(last)
    expect(still.currentIndex).toBe(STEP_COUNT - 1)
  })

  it('preserves totalSteps', () => {
    const s = advance(initialFlowState())
    expect(s.totalSteps).toBe(STEP_COUNT)
  })

  it('does not mutate the input state (pure)', () => {
    const original = initialFlowState()
    advance(original)
    expect(original.currentIndex).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// retreat
// ---------------------------------------------------------------------------

describe('retreat', () => {
  it('decrements currentIndex by 1 from step 2', () => {
    const s2: FlowState = { currentIndex: 2, totalSteps: STEP_COUNT }
    expect(retreat(s2).currentIndex).toBe(1)
  })

  it('does not retreat below 0', () => {
    const s0 = initialFlowState()
    const still = retreat(s0)
    expect(still.currentIndex).toBe(0)
  })

  it('preserves totalSteps', () => {
    const s2: FlowState = { currentIndex: 2, totalSteps: STEP_COUNT }
    expect(retreat(s2).totalSteps).toBe(STEP_COUNT)
  })

  it('does not mutate the input state (pure)', () => {
    const original: FlowState = { currentIndex: 3, totalSteps: STEP_COUNT }
    retreat(original)
    expect(original.currentIndex).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// jumpTo
// ---------------------------------------------------------------------------

describe('jumpTo', () => {
  it('jumps to a valid index', () => {
    const s = jumpTo(initialFlowState(), 4)
    expect(s.currentIndex).toBe(4)
  })

  it('clamps to 0 for negative index', () => {
    expect(jumpTo(initialFlowState(), -5).currentIndex).toBe(0)
  })

  it('clamps to last index for over-range index', () => {
    expect(jumpTo(initialFlowState(), 9999).currentIndex).toBe(STEP_COUNT - 1)
  })

  it('jumps to 0', () => {
    const mid: FlowState = { currentIndex: 3, totalSteps: STEP_COUNT }
    expect(jumpTo(mid, 0).currentIndex).toBe(0)
  })

  it('preserves totalSteps', () => {
    expect(jumpTo(initialFlowState(), 2).totalSteps).toBe(STEP_COUNT)
  })
})

// ---------------------------------------------------------------------------
// isFirst / isLast
// ---------------------------------------------------------------------------

describe('isFirst', () => {
  it('returns true at index 0', () => {
    expect(isFirst(initialFlowState())).toBe(true)
  })

  it('returns false at index 1', () => {
    expect(isFirst(advance(initialFlowState()))).toBe(false)
  })
})

describe('isLast', () => {
  it('returns false at index 0', () => {
    expect(isLast(initialFlowState())).toBe(false)
  })

  it('returns true at the last index', () => {
    const last: FlowState = { currentIndex: STEP_COUNT - 1, totalSteps: STEP_COUNT }
    expect(isLast(last)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// progressLabel
// ---------------------------------------------------------------------------

describe('progressLabel', () => {
  it('returns "Step 1 of N" for the first step', () => {
    expect(progressLabel(initialFlowState())).toBe(`Step 1 of ${STEP_COUNT}`)
  })

  it('returns "Step N of N" for the last step', () => {
    const last: FlowState = { currentIndex: STEP_COUNT - 1, totalSteps: STEP_COUNT }
    expect(progressLabel(last)).toBe(`Step ${STEP_COUNT} of ${STEP_COUNT}`)
  })

  it('increments step number correctly when advanced', () => {
    const s1 = advance(initialFlowState())
    expect(progressLabel(s1)).toBe(`Step 2 of ${STEP_COUNT}`)
  })
})

// ---------------------------------------------------------------------------
// Full advance / retreat round-trip
// ---------------------------------------------------------------------------

describe('advance/retreat round-trip', () => {
  it('advancing then retreating returns to the same index', () => {
    const s0 = initialFlowState()
    const s1 = advance(s0)
    const back = retreat(s1)
    expect(back.currentIndex).toBe(s0.currentIndex)
  })

  it('can walk forward through all steps and back without exceeding bounds', () => {
    let state = initialFlowState()
    for (let i = 0; i < STEP_COUNT + 5; i++) {
      state = advance(state)
    }
    expect(state.currentIndex).toBe(STEP_COUNT - 1)
    for (let i = 0; i < STEP_COUNT + 5; i++) {
      state = retreat(state)
    }
    expect(state.currentIndex).toBe(0)
  })
})
