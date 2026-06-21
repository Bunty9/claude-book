'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  ALL_PRESETS,
  schedulePipeline,
  formatMs,
  formatUsd,
  formatSpeedup,
  TIER_MS_PER_TASK,
  type PipelinePreset,
  type PipelineResult,
  type ScheduledTask,
} from '@/lib/orchestration'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ANIMATION_DURATION_MS = 1_800 // how long the playback "animation" runs (wall-clock)
const PLAYBACK_INTERVAL_MS = 16      // ~60fps rAF-equivalent using setInterval

// Tier badge color semantics
const TIER_CLASSES: Record<string, string> = {
  opus:   'bg-danger-subtle text-danger border border-danger/30',
  sonnet: 'bg-accent-subtle text-accent border border-accent/30',
  haiku:  'bg-tip-subtle text-tip border border-tip/30',
}

const TIER_LABEL: Record<string, string> = {
  opus:   'Opus',
  sonnet: 'Sonnet',
  haiku:  'Haiku',
}

// Lane row background colors (cycle for >3 lanes)
const LANE_BG = [
  'bg-note-subtle/40',
  'bg-tip-subtle/40',
  'bg-warning-subtle/40',
  'bg-accent-subtle/40',
  'bg-danger-subtle/40',
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatPillProps {
  label: string
  value: string
  accent?: boolean
}

function StatPill({ label, value, accent }: StatPillProps) {
  return (
    <div className={`rounded-md px-3 py-2 border ${accent ? 'border-accent/40 bg-accent-subtle' : 'border-border bg-bg-elevated'}`}>
      <div className={`text-lg font-bold tabular-nums ${accent ? 'text-accent' : 'text-fg'}`}>{value}</div>
      <div className="text-[0.7rem] uppercase tracking-wide text-fg-muted">{label}</div>
    </div>
  )
}

interface TierBadgeProps {
  tier: string
}

function TierBadge({ tier }: TierBadgeProps) {
  const cls = TIER_CLASSES[tier] ?? 'bg-bg-elevated text-fg-muted border border-border'
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${cls}`}>
      {TIER_LABEL[tier] ?? tier}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Task bar (Gantt row item)
// ---------------------------------------------------------------------------

interface TaskBarProps {
  task: ScheduledTask
  wallClockMs: number
  playheadFraction: number
  /** Width of the track area in CSS percent of the parent container */
  trackWidthPct: number
}

function TaskBar({ task, wallClockMs, playheadFraction }: TaskBarProps) {
  if (wallClockMs === 0) return null

  const leftPct = (task.startMs / wallClockMs) * 100
  const widthPct = ((task.endMs - task.startMs) / wallClockMs) * 100

  const playheadMs = playheadFraction * wallClockMs
  const isActive = playheadMs >= task.startMs && playheadMs < task.endMs
  const isDone = playheadMs >= task.endMs

  const tierBarColor: Record<string, string> = {
    opus:   'bg-danger/80',
    sonnet: 'bg-accent/80',
    haiku:  'bg-tip/80',
  }
  const barColor = tierBarColor[task.tier] ?? 'bg-fg-muted/60'
  const activeRing = isActive ? 'ring-2 ring-fg/60 ring-offset-1 ring-offset-bg' : ''
  const opacity = isDone ? 'opacity-100' : isActive ? 'opacity-90' : 'opacity-30'

  return (
    <div
      role="listitem"
      aria-label={`${task.label} (${TIER_LABEL[task.tier] ?? task.tier}): ${formatMs(task.startMs)}–${formatMs(task.endMs)}, cost ${formatUsd(task.costUsd)}`}
      className={`absolute top-1 bottom-1 rounded transition-opacity duration-150 ${barColor} ${activeRing} ${opacity} flex items-center overflow-hidden cursor-default`}
      style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 1)}%` }}
    >
      <span className="truncate px-1.5 text-[0.65rem] font-semibold text-fg/90 select-none pointer-events-none">
        {task.label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gantt chart
// ---------------------------------------------------------------------------

interface GanttChartProps {
  result: PipelineResult
  playheadFraction: number
}

function GanttChart({ result, playheadFraction }: GanttChartProps) {
  const { tasks, wallClockMs, lanes } = result

  // Build rows: one per lane + one for orchestrator tasks (laneKey === null)
  const orchTasks = tasks.filter(t => t.laneKey === null)
  const laneRows: { key: string; label: string; tasks: ScheduledTask[]; bgClass: string }[] = []

  if (orchTasks.length > 0) {
    laneRows.push({ key: '__orch__', label: 'Orchestrator', tasks: orchTasks, bgClass: 'bg-bg-subtle/60' })
  }

  lanes.forEach((laneKey, idx) => {
    laneRows.push({
      key: laneKey,
      label: laneKey,
      tasks: tasks.filter(t => t.laneKey === laneKey),
      bgClass: LANE_BG[idx % LANE_BG.length] ?? 'bg-bg-elevated/40',
    })
  })

  // Playhead position
  const playheadLeftPct = playheadFraction * 100

  // Time ruler ticks
  const TICK_COUNT = 5
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => ({
    pct: (i / TICK_COUNT) * 100,
    label: formatMs((i / TICK_COUNT) * wallClockMs),
  }))

  return (
    <div className="mt-3 rounded-md border border-border bg-bg overflow-hidden" aria-label="Gantt chart of agent tasks">
      {/* Time ruler */}
      <div className="relative flex h-6 border-b border-border bg-bg-subtle select-none">
        {ticks.map(tick => (
          <div
            key={tick.pct}
            className="absolute top-0 bottom-0 flex items-center"
            style={{ left: `${tick.pct}%` }}
          >
            <span className="text-[0.6rem] text-fg-subtle pl-0.5">{tick.label}</span>
          </div>
        ))}
      </div>

      {/* Lane rows */}
      {laneRows.map(row => (
        <div key={row.key} className={`relative border-b border-border/50 last:border-0 h-10 ${row.bgClass}`}>
          {/* Lane label */}
          <div className="absolute left-0 top-0 bottom-0 w-24 flex items-center px-2 z-10 bg-bg/70 border-r border-border/40">
            <span className="text-[0.65rem] font-mono text-fg-muted truncate" title={row.label}>
              {row.label}
            </span>
          </div>

          {/* Task bars track */}
          <div className="absolute left-24 right-0 top-0 bottom-0" role="list" aria-label={`Tasks in lane ${row.label}`}>
            {row.tasks.map(task => (
              <TaskBar
                key={task.id}
                task={task}
                wallClockMs={wallClockMs}
                playheadFraction={playheadFraction}
                trackWidthPct={100}
              />
            ))}
          </div>

          {/* Playhead */}
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-px bg-fg/50 pointer-events-none z-20 left-24"
            style={{ transform: `translateX(${playheadLeftPct}%)` }}
          />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Task detail table
// ---------------------------------------------------------------------------

interface TaskTableProps {
  tasks: ScheduledTask[]
  playheadFraction: number
  wallClockMs: number
}

function TaskTable({ tasks, playheadFraction, wallClockMs }: TaskTableProps) {
  const playheadMs = playheadFraction * wallClockMs

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse" role="grid" aria-label="Task detail table">
        <thead>
          <tr className="border-b border-border text-xs text-fg-muted uppercase tracking-wide">
            <th className="pb-2 text-left font-medium pr-3">Task</th>
            <th className="pb-2 text-left font-medium pr-3">Tier</th>
            <th className="pb-2 text-right font-medium pr-3">Start</th>
            <th className="pb-2 text-right font-medium pr-3">End</th>
            <th className="pb-2 text-right font-medium pr-3">Duration</th>
            <th className="pb-2 text-right font-medium">Cost</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => {
            const isDone = playheadMs >= task.endMs
            const isActive = playheadMs >= task.startMs && playheadMs < task.endMs
            const rowColor = isDone
              ? 'text-fg'
              : isActive
              ? 'text-accent font-medium'
              : 'text-fg-subtle'

            return (
              <tr
                key={task.id}
                className={`border-b border-border/50 last:border-0 transition-colors duration-150 ${rowColor}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <td className="py-1.5 pr-3">
                  <span className="font-medium">{task.label}</span>
                  {task.laneKey !== null && (
                    <span className="ml-1.5 text-[0.6rem] font-mono text-fg-subtle">{task.laneKey}</span>
                  )}
                </td>
                <td className="py-1.5 pr-3">
                  <TierBadge tier={task.tier} />
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-xs">{formatMs(task.startMs)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-xs">{formatMs(task.endMs)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-xs">
                  {formatMs(TIER_MS_PER_TASK[task.tier])}
                </td>
                <td className="py-1.5 text-right tabular-nums text-xs">{formatUsd(task.costUsd)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function AgentOrchestrationVisualizer() {
  const headingId = useId()

  const [selectedPresetId, setSelectedPresetId] = useState<string>(ALL_PRESETS[0]?.id ?? '')
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadFraction, setPlayheadFraction] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const preset: PipelinePreset | undefined = ALL_PRESETS.find(p => p.id === selectedPresetId)
  const result: PipelineResult | null = preset ? schedulePipeline(preset.tasks) : null

  const stopPlayback = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    startTimeRef.current = null
    setIsPlaying(false)
  }, [])

  const resetPlayback = useCallback(() => {
    stopPlayback()
    setPlayheadFraction(0)
  }, [stopPlayback])

  const startPlayback = useCallback(() => {
    if (isPlaying) return
    // If at the end, restart from 0
    setPlayheadFraction(prev => {
      if (prev >= 1) return 0
      return prev
    })
    startTimeRef.current = null
    setIsPlaying(true)
  }, [isPlaying])

  // Drive playback via setInterval
  useEffect(() => {
    if (!isPlaying) return

    intervalRef.current = setInterval(() => {
      const now = Date.now()
      if (startTimeRef.current === null) {
        startTimeRef.current = now
      }
      const elapsed = now - startTimeRef.current
      const fraction = Math.min(elapsed / ANIMATION_DURATION_MS, 1)
      setPlayheadFraction(fraction)
      if (fraction >= 1) {
        stopPlayback()
      }
    }, PLAYBACK_INTERVAL_MS)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, stopPlayback])

  // Reset on preset change — sync state reset is intentional (not a cascade risk).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetPlayback()
  }, [selectedPresetId, resetPlayback])

  if (!result || !preset) return null

  const { wallClockMs, serialMs, totalCostUsd, speedup } = result

  return (
    <section
      className="my-6 rounded-lg border border-border bg-bg-subtle p-4 not-prose"
      aria-labelledby={headingId}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div>
          <h3 id={headingId} className="text-sm font-semibold text-fg">
            Agent Orchestration Visualizer
          </h3>
          <p className="mt-0.5 text-xs text-fg-muted">{preset.description}</p>
        </div>
        <span className="text-xs text-fg-subtle italic">Estimates only</span>
      </div>

      {/* Preset selector */}
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Select pipeline preset">
        {ALL_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPresetId(p.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium border transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              p.id === selectedPresetId
                ? 'bg-accent text-accent-fg border-accent'
                : 'bg-bg border-border text-fg-muted hover:border-accent/60 hover:text-fg'
            }`}
            aria-pressed={p.id === selectedPresetId}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatPill label="Wall-clock" value={formatMs(wallClockMs)} accent />
        <StatPill label="Serial equiv." value={formatMs(serialMs)} />
        <StatPill label="Speedup" value={formatSpeedup(speedup)} />
        <StatPill label="Total cost" value={formatUsd(totalCostUsd)} />
      </div>

      {/* Gantt chart */}
      <GanttChart result={result} playheadFraction={playheadFraction} />

      {/* Playback controls */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={startPlayback}
          disabled={isPlaying}
          className="rounded-md px-3 py-1.5 text-xs font-medium border border-border bg-bg text-fg hover:border-accent/60 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
          aria-label="Play animation"
        >
          {isPlaying ? '▶ Playing…' : playheadFraction >= 1 ? '↺ Replay' : '▶ Play'}
        </button>
        <button
          onClick={resetPlayback}
          className="rounded-md px-3 py-1.5 text-xs font-medium border border-border bg-bg text-fg-muted hover:border-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
          aria-label="Reset animation to start"
        >
          ■ Reset
        </button>

        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(playheadFraction * 1000)}
          onChange={e => {
            if (isPlaying) stopPlayback()
            setPlayheadFraction(Number(e.target.value) / 1000)
          }}
          className="flex-1 accent-[var(--accent)] cursor-pointer"
          aria-label="Scrub playhead position"
          aria-valuetext={formatMs(playheadFraction * wallClockMs)}
        />
        <span className="text-xs tabular-nums text-fg-subtle w-12 text-right">
          {formatMs(playheadFraction * wallClockMs)}
        </span>
      </div>

      {/* Task detail table */}
      <TaskTable tasks={result.tasks} playheadFraction={playheadFraction} wallClockMs={wallClockMs} />

      {/* Tier legend */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-fg-muted items-center">
        <span className="font-medium text-fg-subtle">Tier:</span>
        {(['opus', 'sonnet', 'haiku'] as const).map(tier => (
          <span key={tier} className="flex items-center gap-1">
            <TierBadge tier={tier} />
            <span className="text-fg-subtle">
              ~{formatMs(TIER_MS_PER_TASK[tier])}
            </span>
          </span>
        ))}
        <span className="ml-2 italic text-fg-subtle">
          Parallelism requires independent worktree lanes.
        </span>
      </div>
    </section>
  )
}
