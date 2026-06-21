import { describe, it, expect } from 'vitest'
import {
  computeTaskCost,
  topoSort,
  schedulePipeline,
  formatMs,
  formatUsd,
  formatSpeedup,
  PRESET_SEQUENTIAL,
  PRESET_PARALLEL,
  PRESET_MIXED,
  TIER_MS_PER_TASK,
  TIER_TOKENS_PER_TASK,
  TIER_INPUT_PER_M,
  type AgentTask,
} from './orchestration'

// ---------------------------------------------------------------------------
// computeTaskCost
// ---------------------------------------------------------------------------
describe('computeTaskCost', () => {
  it('returns a positive number for every tier', () => {
    const tiers = ['opus', 'sonnet', 'haiku'] as const
    for (const tier of tiers) {
      const task: AgentTask = { id: 'x', label: 'x', tier, dependsOn: [], laneKey: null }
      expect(computeTaskCost(task)).toBeGreaterThan(0)
    }
  })

  it('opus costs more than sonnet, sonnet more than haiku', () => {
    const make = (tier: AgentTask['tier']): AgentTask => ({ id: tier, label: tier, tier, dependsOn: [], laneKey: null })
    const opus = computeTaskCost(make('opus'))
    const sonnet = computeTaskCost(make('sonnet'))
    const haiku = computeTaskCost(make('haiku'))
    expect(opus).toBeGreaterThan(sonnet)
    expect(sonnet).toBeGreaterThan(haiku)
  })

  it('matches manual formula: tokens/1M * pricePerM * 2 (round-trip)', () => {
    const task: AgentTask = { id: 't', label: 't', tier: 'sonnet', dependsOn: [], laneKey: null }
    const expected = (TIER_TOKENS_PER_TASK.sonnet / 1_000_000) * TIER_INPUT_PER_M.sonnet * 2
    expect(computeTaskCost(task)).toBeCloseTo(expected)
  })
})

// ---------------------------------------------------------------------------
// topoSort
// ---------------------------------------------------------------------------
describe('topoSort', () => {
  it('returns all tasks', () => {
    const tasks: AgentTask[] = [
      { id: 'a', label: 'A', tier: 'haiku', dependsOn: [],    laneKey: null },
      { id: 'b', label: 'B', tier: 'haiku', dependsOn: ['a'], laneKey: null },
    ]
    const sorted = topoSort(tasks)
    expect(sorted.map(t => t.id).sort()).toEqual(['a', 'b'])
  })

  it('places dependencies before dependents', () => {
    const tasks: AgentTask[] = [
      { id: 'c', label: 'C', tier: 'haiku', dependsOn: ['a', 'b'], laneKey: null },
      { id: 'b', label: 'B', tier: 'haiku', dependsOn: ['a'],      laneKey: null },
      { id: 'a', label: 'A', tier: 'haiku', dependsOn: [],          laneKey: null },
    ]
    const sorted = topoSort(tasks)
    const idx = (id: string) => sorted.findIndex(t => t.id === id)
    expect(idx('a')).toBeLessThan(idx('b'))
    expect(idx('a')).toBeLessThan(idx('c'))
    expect(idx('b')).toBeLessThan(idx('c'))
  })

  it('throws on a direct cycle', () => {
    const tasks: AgentTask[] = [
      { id: 'a', label: 'A', tier: 'haiku', dependsOn: ['b'], laneKey: null },
      { id: 'b', label: 'B', tier: 'haiku', dependsOn: ['a'], laneKey: null },
    ]
    expect(() => topoSort(tasks)).toThrow(/Cycle/)
  })

  it('throws on an unknown dependency id', () => {
    const tasks: AgentTask[] = [
      { id: 'a', label: 'A', tier: 'haiku', dependsOn: ['ghost'], laneKey: null },
    ]
    expect(() => topoSort(tasks)).toThrow(/Unknown task/)
  })

  it('handles diamond DAG without error', () => {
    const tasks: AgentTask[] = [
      { id: 'root',  label: 'root',  tier: 'haiku', dependsOn: [],             laneKey: null },
      { id: 'left',  label: 'left',  tier: 'haiku', dependsOn: ['root'],       laneKey: null },
      { id: 'right', label: 'right', tier: 'haiku', dependsOn: ['root'],       laneKey: null },
      { id: 'tip',   label: 'tip',   tier: 'haiku', dependsOn: ['left','right'], laneKey: null },
    ]
    const sorted = topoSort(tasks)
    const idx = (id: string) => sorted.findIndex(t => t.id === id)
    expect(idx('root')).toBeLessThan(idx('left'))
    expect(idx('root')).toBeLessThan(idx('right'))
    expect(idx('left')).toBeLessThan(idx('tip'))
    expect(idx('right')).toBeLessThan(idx('tip'))
  })
})

// ---------------------------------------------------------------------------
// schedulePipeline — sequential preset
// ---------------------------------------------------------------------------
describe('schedulePipeline — sequential preset', () => {
  it('produces one scheduled task per input task', () => {
    const result = schedulePipeline(PRESET_SEQUENTIAL.tasks)
    expect(result.tasks).toHaveLength(PRESET_SEQUENTIAL.tasks.length)
  })

  it('wall-clock equals serial sum when all tasks are in one lane', () => {
    const result = schedulePipeline(PRESET_SEQUENTIAL.tasks)
    expect(result.wallClockMs).toBe(result.serialMs)
  })

  it('speedup is 1.0 for a fully sequential pipeline', () => {
    const result = schedulePipeline(PRESET_SEQUENTIAL.tasks)
    expect(result.speedup).toBeCloseTo(1.0)
  })

  it('tasks start after their dependency ends', () => {
    const result = schedulePipeline(PRESET_SEQUENTIAL.tasks)
    const byId = new Map(result.tasks.map(t => [t.id, t]))
    for (const task of result.tasks) {
      for (const depId of task.dependsOn) {
        const dep = byId.get(depId)
        if (dep === undefined) throw new Error(`missing dep ${depId}`)
        expect(task.startMs).toBeGreaterThanOrEqual(dep.endMs)
      }
    }
  })

  it('each task endMs = startMs + tier duration', () => {
    const result = schedulePipeline(PRESET_SEQUENTIAL.tasks)
    for (const task of result.tasks) {
      expect(task.endMs).toBe(task.startMs + TIER_MS_PER_TASK[task.tier])
    }
  })

  it('total cost is sum of individual task costs', () => {
    const result = schedulePipeline(PRESET_SEQUENTIAL.tasks)
    const summed = result.tasks.reduce((s, t) => s + t.costUsd, 0)
    expect(result.totalCostUsd).toBeCloseTo(summed)
  })
})

// ---------------------------------------------------------------------------
// schedulePipeline — parallel preset
// ---------------------------------------------------------------------------
describe('schedulePipeline — parallel preset', () => {
  it('wall-clock is strictly less than serialMs (parallelism saves time)', () => {
    const result = schedulePipeline(PRESET_PARALLEL.tasks)
    expect(result.wallClockMs).toBeLessThan(result.serialMs)
  })

  it('speedup is greater than 1 for parallel preset', () => {
    const result = schedulePipeline(PRESET_PARALLEL.tasks)
    expect(result.speedup).toBeGreaterThan(1)
  })

  it('lanes are populated correctly', () => {
    const result = schedulePipeline(PRESET_PARALLEL.tasks)
    expect(result.lanes).toContain('wt-a')
    expect(result.lanes).toContain('wt-b')
    expect(result.lanes).toContain('wt-c')
  })

  it('tasks in the same lane do not overlap', () => {
    const result = schedulePipeline(PRESET_PARALLEL.tasks)
    // Group by laneKey
    const byLane = new Map<string, typeof result.tasks[number][]>()
    for (const task of result.tasks) {
      const key = task.laneKey ?? '__orch__'
      const arr = byLane.get(key) ?? []
      arr.push(task)
      byLane.set(key, arr)
    }
    for (const [, laneTasks] of byLane) {
      const sorted = [...laneTasks].sort((a, b) => a.startMs - b.startMs)
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const curr = sorted[i]
        // Non-overlapping: current starts at or after prev ends
        expect(curr.startMs).toBeGreaterThanOrEqual(prev.endMs)
      }
    }
  })

  it('the merge task starts only after all three test tasks finish', () => {
    const result = schedulePipeline(PRESET_PARALLEL.tasks)
    const byId = new Map(result.tasks.map(t => [t.id, t]))
    const merge = byId.get('merge')
    const testsA = byId.get('tests-a')
    const testsB = byId.get('tests-b')
    const testsC = byId.get('tests-c')
    if (!merge || !testsA || !testsB || !testsC) throw new Error('missing tasks')
    expect(merge.startMs).toBeGreaterThanOrEqual(testsA.endMs)
    expect(merge.startMs).toBeGreaterThanOrEqual(testsB.endMs)
    expect(merge.startMs).toBeGreaterThanOrEqual(testsC.endMs)
  })
})

// ---------------------------------------------------------------------------
// schedulePipeline — mixed preset
// ---------------------------------------------------------------------------
describe('schedulePipeline — mixed preset', () => {
  it('analyze-a and analyze-b start at the same time (both depend only on research)', () => {
    const result = schedulePipeline(PRESET_MIXED.tasks)
    const byId = new Map(result.tasks.map(t => [t.id, t]))
    const a = byId.get('analyze-a')
    const b = byId.get('analyze-b')
    if (!a || !b) throw new Error('missing tasks')
    expect(a.startMs).toBe(b.startMs)
  })

  it('synthesize starts after both analysis tasks finish', () => {
    const result = schedulePipeline(PRESET_MIXED.tasks)
    const byId = new Map(result.tasks.map(t => [t.id, t]))
    const synth = byId.get('synthesize')
    const a = byId.get('analyze-a')
    const b = byId.get('analyze-b')
    if (!synth || !a || !b) throw new Error('missing tasks')
    const latestAnalysis = Math.max(a.endMs, b.endMs)
    expect(synth.startMs).toBeGreaterThanOrEqual(latestAnalysis)
  })

  it('speedup is greater than 1', () => {
    const result = schedulePipeline(PRESET_MIXED.tasks)
    expect(result.speedup).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// schedulePipeline — edge cases
// ---------------------------------------------------------------------------
describe('schedulePipeline — edge cases', () => {
  it('empty pipeline returns zeros', () => {
    const result = schedulePipeline([])
    expect(result.wallClockMs).toBe(0)
    expect(result.totalCostUsd).toBe(0)
    expect(result.serialMs).toBe(0)
    expect(result.speedup).toBe(1)
    expect(result.lanes).toHaveLength(0)
    expect(result.tasks).toHaveLength(0)
  })

  it('single task pipeline: wall-clock = task duration', () => {
    const tasks: AgentTask[] = [
      { id: 'solo', label: 'Solo', tier: 'haiku', dependsOn: [], laneKey: 'main' },
    ]
    const result = schedulePipeline(tasks)
    expect(result.wallClockMs).toBe(TIER_MS_PER_TASK.haiku)
    expect(result.speedup).toBeCloseTo(1.0)
  })

  it('two independent tasks in different lanes run concurrently', () => {
    const tasks: AgentTask[] = [
      { id: 'a', label: 'A', tier: 'haiku', dependsOn: [], laneKey: 'lane-a' },
      { id: 'b', label: 'B', tier: 'haiku', dependsOn: [], laneKey: 'lane-b' },
    ]
    const result = schedulePipeline(tasks)
    // Wall-clock = single task duration (they run in parallel)
    expect(result.wallClockMs).toBe(TIER_MS_PER_TASK.haiku)
    // Serial would be 2x
    expect(result.serialMs).toBe(TIER_MS_PER_TASK.haiku * 2)
    expect(result.speedup).toBeCloseTo(2.0)
  })

  it('two tasks in the same lane run serially', () => {
    const tasks: AgentTask[] = [
      { id: 'a', label: 'A', tier: 'haiku', dependsOn: [],    laneKey: 'main' },
      { id: 'b', label: 'B', tier: 'haiku', dependsOn: ['a'], laneKey: 'main' },
    ]
    const result = schedulePipeline(tasks)
    expect(result.wallClockMs).toBe(TIER_MS_PER_TASK.haiku * 2)
    expect(result.speedup).toBeCloseTo(1.0)
  })
})

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
describe('formatMs', () => {
  it('shows ms for sub-second values', () => {
    expect(formatMs(500)).toBe('500ms')
  })
  it('shows seconds for 1000ms', () => {
    expect(formatMs(1000)).toBe('1.0s')
  })
  it('shows seconds for 2500ms', () => {
    expect(formatMs(2500)).toBe('2.5s')
  })
  it('shows minutes for values >= 60000ms', () => {
    expect(formatMs(60_000)).toBe('1.0m')
    expect(formatMs(90_000)).toBe('1.5m')
  })
})

describe('formatUsd', () => {
  it('returns $0 for zero', () => {
    expect(formatUsd(0)).toBe('$0')
  })
  it('uses 4 decimal places for small amounts', () => {
    expect(formatUsd(0.005)).toBe('$0.0050')
  })
  it('uses 2 decimal places for larger amounts', () => {
    expect(formatUsd(1.5)).toBe('$1.50')
  })
})

describe('formatSpeedup', () => {
  it('appends × and one decimal', () => {
    expect(formatSpeedup(2.0)).toBe('2.0×')
    expect(formatSpeedup(1.0)).toBe('1.0×')
    expect(formatSpeedup(3.7)).toBe('3.7×')
  })
})
