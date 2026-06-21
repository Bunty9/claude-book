/**
 * orchestration.ts — pure, deterministic logic for the AgentOrchestrationVisualizer.
 *
 * Models sequential vs parallel multi-agent pipelines, worktree isolation lanes,
 * and cost tiers. All wall-clock estimates are deterministic functions of the
 * input — no randomness, no side effects, no I/O.
 */

// ---------------------------------------------------------------------------
// Cost tier — maps to Claude model families from cost.ts
// ---------------------------------------------------------------------------

export type CostTier = 'opus' | 'sonnet' | 'haiku'

/** USD cost per 1M tokens for each tier (input price, list prices 2026). */
export const TIER_INPUT_PER_M: Record<CostTier, number> = {
  opus:   15,
  sonnet:  3,
  haiku:   0.8,
}

/** Estimated tokens consumed per agent task (rough order-of-magnitude). */
export const TIER_TOKENS_PER_TASK: Record<CostTier, number> = {
  opus:   8_000,
  sonnet: 4_000,
  haiku:  2_000,
}

/** Latency estimate (ms) per task for each tier (wall-clock, simplified). */
export const TIER_MS_PER_TASK: Record<CostTier, number> = {
  opus:   6_000,
  sonnet: 2_500,
  haiku:  1_000,
}

// ---------------------------------------------------------------------------
// Agent task definition
// ---------------------------------------------------------------------------

export interface AgentTask {
  /** Stable unique identifier (slug). */
  id: string
  /** Human-readable label shown in the visualizer. */
  label: string
  /** Tier determines latency + cost estimates. */
  tier: CostTier
  /**
   * IDs of tasks that must complete before this one can start.
   * Empty array = no dependencies (starts immediately when its lane is open).
   */
  dependsOn: string[]
  /**
   * Worktree lane key. Tasks in the same lane share an isolated git worktree.
   * Tasks in different lanes can run concurrently (parallel orchestration).
   * `null` = orchestrator task, no worktree.
   */
  laneKey: string | null
}

// ---------------------------------------------------------------------------
// Scheduled task — result of compute
// ---------------------------------------------------------------------------

export interface ScheduledTask extends AgentTask {
  /** Earliest start time (ms from t=0). */
  startMs: number
  /** Wall-clock finish time (ms from t=0). */
  endMs: number
  /** USD cost estimate for this task alone. */
  costUsd: number
}

// ---------------------------------------------------------------------------
// Pipeline result
// ---------------------------------------------------------------------------

export interface PipelineResult {
  /** All tasks with computed timing and cost. */
  tasks: ScheduledTask[]
  /**
   * Wall-clock duration of the whole pipeline (ms).
   * = max(endMs) across all tasks.
   */
  wallClockMs: number
  /** Sum of all task costs (USD). */
  totalCostUsd: number
  /** Sum of all task durations (ms) — "serial equivalent" for comparison. */
  serialMs: number
  /** Speedup ratio: serialMs / wallClockMs. */
  speedup: number
  /** Distinct lane keys (non-null), in the order they first appear. */
  lanes: string[]
}

// ---------------------------------------------------------------------------
// Scheduling helpers
// ---------------------------------------------------------------------------

/**
 * Compute USD cost for a single task.
 * Uses input-only pricing as a conservative estimate (agent tasks are
 * context-heavy; output is assumed equal to input tokens).
 */
export function computeTaskCost(task: AgentTask): number {
  const tokens = TIER_TOKENS_PER_TASK[task.tier]
  const perM = TIER_INPUT_PER_M[task.tier]
  // round-trip: input + output (assume symmetric)
  return (tokens / 1_000_000) * perM * 2
}

/**
 * Topologically sort tasks by dependency order.
 * Throws if a cycle is detected or a dependency ID is missing.
 */
export function topoSort(tasks: AgentTask[]): AgentTask[] {
  const byId = new Map<string, AgentTask>(tasks.map(t => [t.id, t]))
  const visited = new Set<string>()
  const inStack = new Set<string>()
  const result: AgentTask[] = []

  function visit(id: string): void {
    if (visited.has(id)) return
    if (inStack.has(id)) {
      throw new Error(`Cycle detected involving task "${id}"`)
    }
    const task = byId.get(id)
    if (task === undefined) {
      throw new Error(`Unknown task id "${id}"`)
    }
    inStack.add(id)
    for (const dep of task.dependsOn) {
      visit(dep)
    }
    inStack.delete(id)
    visited.add(id)
    result.push(task)
  }

  for (const task of tasks) {
    visit(task.id)
  }

  return result
}

/**
 * Schedule a pipeline of tasks — the core scheduling engine.
 *
 * Rules:
 * - A task starts as soon as all its `dependsOn` tasks have finished.
 * - Tasks in different lanes run concurrently (they share no worktree).
 * - Within a lane, tasks run sequentially (one at a time per worktree).
 *   This is enforced by treating each lane as a resource with a "free-at" timestamp.
 * - Orchestrator tasks (laneKey === null) are sequential among themselves
 *   (they share the main thread).
 *
 * All scheduling is deterministic given the same input order.
 */
export function schedulePipeline(tasks: AgentTask[]): PipelineResult {
  const sorted = topoSort(tasks)
  const finishAt = new Map<string, number>()   // taskId → endMs
  const laneFreAt = new Map<string, number>()  // laneKey → first free ms
  const ORCH_LANE = '__orchestrator__'

  const scheduled: ScheduledTask[] = []

  for (const task of sorted) {
    // Earliest start from dependencies
    let depReady = 0
    for (const dep of task.dependsOn) {
      const f = finishAt.get(dep)
      if (f === undefined) throw new Error(`Dependency "${dep}" not yet scheduled`)
      depReady = Math.max(depReady, f)
    }

    // Lane resource constraint
    const laneKey = task.laneKey ?? ORCH_LANE
    const laneReady = laneFreAt.get(laneKey) ?? 0
    const startMs = Math.max(depReady, laneReady)

    const durationMs = TIER_MS_PER_TASK[task.tier]
    const endMs = startMs + durationMs
    const costUsd = computeTaskCost(task)

    laneFreAt.set(laneKey, endMs)
    finishAt.set(task.id, endMs)

    scheduled.push({ ...task, startMs, endMs, costUsd })
  }

  const wallClockMs = Math.max(0, ...scheduled.map(t => t.endMs))
  const totalCostUsd = scheduled.reduce((s, t) => s + t.costUsd, 0)
  const serialMs = scheduled.reduce((s, t) => s + TIER_MS_PER_TASK[t.tier], 0)
  const speedup = wallClockMs > 0 ? serialMs / wallClockMs : 1

  // Collect unique non-null lane keys in first-appearance order
  const seenLanes = new Set<string>()
  const lanes: string[] = []
  for (const t of sorted) {
    if (t.laneKey !== null && !seenLanes.has(t.laneKey)) {
      seenLanes.add(t.laneKey)
      lanes.push(t.laneKey)
    }
  }

  return { tasks: scheduled, wallClockMs, totalCostUsd, serialMs, speedup, lanes }
}

// ---------------------------------------------------------------------------
// Preset pipelines for the visualizer
// ---------------------------------------------------------------------------

export interface PipelinePreset {
  id: string
  label: string
  description: string
  tasks: AgentTask[]
}

/**
 * Sequential: each step depends on the previous one, single lane.
 * Demonstrates that there's no parallelism benefit here.
 */
export const PRESET_SEQUENTIAL: PipelinePreset = {
  id: 'sequential',
  label: 'Sequential',
  description: 'One agent finishes before the next starts — classic linear pipeline.',
  tasks: [
    { id: 'plan',   label: 'Plan',   tier: 'sonnet', dependsOn: [],       laneKey: 'main' },
    { id: 'code',   label: 'Code',   tier: 'sonnet', dependsOn: ['plan'], laneKey: 'main' },
    { id: 'test',   label: 'Test',   tier: 'haiku',  dependsOn: ['code'], laneKey: 'main' },
    { id: 'review', label: 'Review', tier: 'opus',   dependsOn: ['test'], laneKey: 'main' },
  ],
}

/**
 * Parallel worktrees: three feature agents run concurrently in separate lanes;
 * an integration agent waits for all three.
 */
export const PRESET_PARALLEL: PipelinePreset = {
  id: 'parallel',
  label: 'Parallel Worktrees',
  description: 'Three feature agents in isolated worktrees; integrator waits for all.',
  tasks: [
    { id: 'plan',    label: 'Plan',      tier: 'sonnet', dependsOn: [],                          laneKey: null },
    { id: 'feat-a',  label: 'Feature A', tier: 'sonnet', dependsOn: ['plan'],                    laneKey: 'wt-a' },
    { id: 'feat-b',  label: 'Feature B', tier: 'sonnet', dependsOn: ['plan'],                    laneKey: 'wt-b' },
    { id: 'feat-c',  label: 'Feature C', tier: 'haiku',  dependsOn: ['plan'],                    laneKey: 'wt-c' },
    { id: 'tests-a', label: 'Tests A',   tier: 'haiku',  dependsOn: ['feat-a'],                  laneKey: 'wt-a' },
    { id: 'tests-b', label: 'Tests B',   tier: 'haiku',  dependsOn: ['feat-b'],                  laneKey: 'wt-b' },
    { id: 'tests-c', label: 'Tests C',   tier: 'haiku',  dependsOn: ['feat-c'],                  laneKey: 'wt-c' },
    { id: 'merge',   label: 'Integrate', tier: 'opus',   dependsOn: ['tests-a','tests-b','tests-c'], laneKey: null },
  ],
}

/**
 * Mixed: combines a sequential chain with one parallel fan-out.
 * Research phase fans out into 2 parallel analysis agents, then merges.
 */
export const PRESET_MIXED: PipelinePreset = {
  id: 'mixed',
  label: 'Mixed (Fan-out)',
  description: 'Research fans into two parallel analysis lanes, then synthesizes.',
  tasks: [
    { id: 'research',   label: 'Research',  tier: 'opus',   dependsOn: [],                        laneKey: null     },
    { id: 'analyze-a',  label: 'Analysis A', tier: 'sonnet', dependsOn: ['research'],              laneKey: 'lane-a' },
    { id: 'analyze-b',  label: 'Analysis B', tier: 'sonnet', dependsOn: ['research'],              laneKey: 'lane-b' },
    { id: 'synthesize', label: 'Synthesize', tier: 'opus',   dependsOn: ['analyze-a','analyze-b'], laneKey: null     },
    { id: 'write',      label: 'Write',      tier: 'sonnet', dependsOn: ['synthesize'],            laneKey: null     },
  ],
}

export const ALL_PRESETS: PipelinePreset[] = [
  PRESET_SEQUENTIAL,
  PRESET_PARALLEL,
  PRESET_MIXED,
]

// ---------------------------------------------------------------------------
// Formatting helpers (pure)
// ---------------------------------------------------------------------------

/** Format ms as a human-readable duration string. */
export function formatMs(ms: number): string {
  if (ms < 1_000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)}m`
}

/** Format USD with appropriate precision. */
export function formatUsd(usd: number): string {
  if (usd === 0) return '$0'
  if (usd < 0.001) return `$${usd.toFixed(5)}`
  if (usd < 0.01) return `$${usd.toFixed(4)}`
  if (usd < 1) return `$${usd.toFixed(3)}`
  return `$${usd.toFixed(2)}`
}

/** Format speedup ratio to one decimal place. */
export function formatSpeedup(speedup: number): string {
  return `${speedup.toFixed(1)}×`
}
