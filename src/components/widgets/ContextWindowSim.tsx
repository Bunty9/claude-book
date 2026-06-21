'use client'

import React, { useState, useId } from 'react'
import {
  PRESETS,
  BUDGET_OPTIONS,
  MAX_TURNS,
  buildSession,
  computeFill,
  compactionThreshold,
  formatTokens,
  type TurnKind,
} from '@/lib/contextSim'

// ── Colour mapping ───────────────────────────────────────────────────────────

/** Maps turn kind to a Tailwind bg token class for the stacked bar. */
function kindBg(kind: TurnKind): string {
  switch (kind) {
    case 'message':     return 'bg-accent'
    case 'file-read':   return 'bg-note'
    case 'search':      return 'bg-tip'
    case 'tool-result': return 'bg-warning'
  }
}

/** Maps turn kind to a text token class for the legend dot. */
function kindText(kind: TurnKind): string {
  switch (kind) {
    case 'message':     return 'text-accent'
    case 'file-read':   return 'text-note'
    case 'search':      return 'text-tip'
    case 'tool-result': return 'text-warning'
  }
}

function kindLabel(kind: TurnKind): string {
  switch (kind) {
    case 'message':     return 'Message'
    case 'file-read':   return 'File read'
    case 'search':      return 'Search result'
    case 'tool-result': return 'Tool result'
  }
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface FillBarProps {
  fill: number
  threshold: number
  budgetLabel: string
  compacted: boolean
}

function FillBar({ fill, threshold, budgetLabel, compacted }: FillBarProps) {
  const pct = Math.round(fill * 100)
  const thresholdPct = Math.round(threshold * 100)

  return (
    <div>
      <div className="mb-1 flex items-end justify-between">
        <span className="text-xs font-semibold text-fg-muted uppercase tracking-wide">
          Context fill — budget {budgetLabel}
        </span>
        <span
          className={`text-sm font-bold tabular-nums transition-colors duration-300 ${
            compacted ? 'text-warning' : fill >= threshold ? 'text-danger' : 'text-accent'
          }`}
          aria-live="polite"
        >
          {pct}%
        </span>
      </div>

      {/* Track */}
      <div
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Context window ${pct}% full`}
        className="relative h-5 w-full rounded bg-bg-elevated overflow-hidden border border-border"
      >
        {/* Fill */}
        <div
          className={`h-full transition-all duration-300 ${
            compacted
              ? 'bg-warning'
              : fill >= threshold
              ? 'bg-danger'
              : 'bg-accent'
          }`}
          style={{ width: `${pct}%` }}
        />

        {/* Compaction threshold marker */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 w-px bg-danger opacity-70"
          style={{ left: `${thresholdPct}%` }}
          title={`Compaction triggers at ~${thresholdPct}%`}
        />
      </div>

      {/* Threshold legend */}
      <div className="mt-1 flex items-center gap-1.5">
        <div
          aria-hidden="true"
          className="h-2.5 w-px bg-danger opacity-70"
        />
        <span className="text-xs text-fg-subtle">
          Compaction threshold ≈ {thresholdPct}%
        </span>
        {compacted && (
          <span className="ml-2 rounded border border-warning/40 bg-warning-subtle px-1.5 py-0.5 text-xs font-medium text-warning">
            /compact triggered
          </span>
        )}
        {!compacted && fill >= threshold && (
          <span className="ml-2 rounded border border-danger/40 bg-danger-subtle px-1.5 py-0.5 text-xs font-medium text-danger">
            Approaching limit
          </span>
        )}
      </div>
    </div>
  )
}

interface TurnStackProps {
  systemTokens: number
  turns: ReturnType<typeof buildSession>['turns']
  totalTokens: number
  budget: number
}

function TurnStack({ systemTokens, turns, totalTokens, budget }: TurnStackProps) {
  const visibleTurns = turns.slice(-14) // cap the visible list so it fits on screen

  return (
    <div
      role="list"
      aria-label="Context window turns (newest at bottom)"
      className="flex flex-col gap-1"
    >
      {/* System block (always first) */}
      <div
        role="listitem"
        className="flex items-center gap-2 rounded border border-border bg-bg-elevated px-2.5 py-1.5"
      >
        <span className="h-2 w-2 rounded-sm bg-fg-subtle shrink-0" aria-hidden="true" />
        <span className="text-xs font-medium text-fg-muted flex-1">
          System block (CLAUDE.md + tools)
        </span>
        <span className="text-xs tabular-nums text-fg-subtle">
          {formatTokens(systemTokens)} tok
        </span>
      </div>

      {turns.length > 14 && (
        <div
          role="listitem"
          aria-label={`${turns.length - 14} earlier turns collapsed`}
          className="px-2.5 py-1 text-xs text-fg-subtle text-center italic"
        >
          … {turns.length - 14} earlier turns
        </div>
      )}

      {visibleTurns.map(turn => {
        const widthPct = budget > 0 ? Math.min(100, (turn.tokenCost / budget) * 100) : 0
        return (
          <div
            key={turn.index}
            role="listitem"
            aria-label={`Turn ${turn.index + 1}: ${turn.label}, ${formatTokens(turn.tokenCost)} tokens`}
            className="flex items-center gap-2 rounded border border-border bg-bg-subtle px-2.5 py-1.5"
          >
            {/* Role badge */}
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums
                ${turn.role === 'assistant'   ? 'bg-accent-subtle text-accent' :
                  turn.role === 'tool-result' ? 'bg-warning-subtle text-warning' :
                                               'bg-bg-elevated text-fg-muted'}`}
              aria-hidden="true"
            >
              {turn.role === 'assistant'   ? 'A' :
               turn.role === 'tool-result' ? 'T' : 'U'}
            </span>

            {/* Label */}
            <span className="text-xs text-fg flex-1 truncate">{turn.label}</span>

            {/* Mini proportional bar */}
            <div
              aria-hidden="true"
              className="h-1.5 w-20 shrink-0 rounded-full bg-bg-elevated overflow-hidden"
              title={`${formatTokens(turn.tokenCost)} tokens`}
            >
              <div
                className={`h-full rounded-full ${kindBg(turn.kind)}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>

            {/* Token count */}
            <span className="text-xs tabular-nums text-fg-subtle w-14 text-right shrink-0">
              {formatTokens(turn.tokenCost)} tok
            </span>
          </div>
        )
      })}

      {/* Total row */}
      <div className="mt-1 flex items-center justify-between rounded border border-border px-2.5 py-1.5 bg-bg-elevated">
        <span className="text-xs font-semibold text-fg">Total in context</span>
        <span className="text-xs font-bold tabular-nums text-accent">
          {formatTokens(totalTokens)} tok
        </span>
      </div>
    </div>
  )
}

// ── Legend ───────────────────────────────────────────────────────────────────

const LEGEND_KINDS: ReadonlyArray<TurnKind> = ['message', 'file-read', 'search']

function Legend() {
  return (
    <div
      role="list"
      aria-label="Turn kind legend"
      className="flex flex-wrap gap-x-4 gap-y-1.5"
    >
      {LEGEND_KINDS.map(kind => (
        <div
          key={kind}
          role="listitem"
          className="flex items-center gap-1.5"
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-sm ${kindBg(kind)}`}
          />
          <span className={`text-xs ${kindText(kind)}`}>{kindLabel(kind)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main widget ──────────────────────────────────────────────────────────────

export function ContextWindowSim() {
  const [preset, setPreset] = useState<'lean' | 'bloated'>('lean')
  const [turns, setTurns] = useState(10)
  const [budgetIndex, setBudgetIndex] = useState(2) // 100 K default

  const sliderId   = useId()
  const budgetId   = useId()
  const presetId   = useId()

  const budget = BUDGET_OPTIONS[budgetIndex]?.tokens ?? 100_000
  const budgetLabel = BUDGET_OPTIONS[budgetIndex]?.label ?? '100 K'

  const session   = buildSession(preset, turns)
  const fill      = computeFill(session.totalTokens, budget)
  const threshold = compactionThreshold()
  const compacted = fill >= threshold

  return (
    <div className="my-6 rounded-lg border border-border bg-bg-subtle p-4 not-prose space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-fg">Context Window Simulator</p>
          <p className="text-xs text-fg-muted mt-0.5">
            Watch the context fill and see when compaction triggers.
          </p>
        </div>
        <Legend />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Preset selector */}
        <div>
          <label
            htmlFor={presetId}
            className="mb-1 block text-xs font-medium text-fg-muted"
          >
            Preset
          </label>
          <select
            id={presetId}
            value={preset}
            onChange={e => {
              const v = e.target.value
              if (v === 'lean' || v === 'bloated') setPreset(v)
            }}
            className="w-full rounded border border-border bg-bg px-2.5 py-1.5 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {(Object.keys(PRESETS) as Array<'lean' | 'bloated'>).map(key => (
              <option key={key} value={key}>
                {PRESETS[key].label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-fg-subtle leading-snug">
            {PRESETS[preset].description}
          </p>
        </div>

        {/* Turn slider */}
        <div>
          <label
            htmlFor={sliderId}
            className="mb-1 flex justify-between text-xs font-medium text-fg-muted"
          >
            <span>Turns in session</span>
            <span className="tabular-nums text-fg font-bold">{turns}</span>
          </label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={MAX_TURNS}
            step={1}
            value={turns}
            onChange={e => setTurns(Number(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={MAX_TURNS}
            aria-valuenow={turns}
            aria-label={`Number of turns: ${turns}`}
            className="w-full accent-[var(--accent)]"
          />
          <div className="flex justify-between text-xs text-fg-subtle mt-0.5">
            <span>0</span>
            <span>{MAX_TURNS}</span>
          </div>
        </div>

        {/* Budget selector */}
        <div>
          <label
            htmlFor={budgetId}
            className="mb-1 block text-xs font-medium text-fg-muted"
          >
            Token budget
          </label>
          <select
            id={budgetId}
            value={budgetIndex}
            onChange={e => setBudgetIndex(Number(e.target.value))}
            className="w-full rounded border border-border bg-bg px-2.5 py-1.5 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {BUDGET_OPTIONS.map((opt, i) => (
              <option key={opt.label} value={i}>
                {opt.label} tokens
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-fg-subtle">
            {formatTokens(budget)} token context window
          </p>
        </div>
      </div>

      {/* Fill bar */}
      <FillBar
        fill={fill}
        threshold={threshold}
        budgetLabel={budgetLabel}
        compacted={compacted}
      />

      {/* Turn list */}
      {turns > 0 ? (
        <TurnStack
          systemTokens={session.systemTokens}
          turns={session.turns}
          totalTokens={session.totalTokens}
          budget={budget}
        />
      ) : (
        <div className="rounded border border-border bg-bg-elevated px-4 py-6 text-center text-sm text-fg-muted">
          Set turns &gt; 0 to start filling the context window.
        </div>
      )}

      {/* Stats strip */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3">
        <Stat label="System block" value={formatTokens(session.systemTokens) + ' tok'} />
        <Stat label="Turn total"   value={formatTokens(session.totalTokens - session.systemTokens) + ' tok'} />
        <Stat label="Grand total"  value={formatTokens(session.totalTokens) + ' tok'} />
        <Stat label="Remaining"    value={formatTokens(Math.max(0, budget - session.totalTokens)) + ' tok'} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs text-fg-subtle">{label}</span>
      <span className="block text-sm font-bold tabular-nums text-fg">{value}</span>
    </div>
  )
}
