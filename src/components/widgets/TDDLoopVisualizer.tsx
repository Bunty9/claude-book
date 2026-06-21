'use client'

import React, { useState, useCallback, useId } from 'react'
import {
  TDD_PHASES,
  TDD_TRANSITIONS,
  nextPhase,
  prevPhase,
  agentLoadPercent,
  type PhaseId,
  type TDDPhase,
} from '@/lib/tddLoop'

// ---------------------------------------------------------------------------
// Token-colour mapping — role → Tailwind token utilities only (no raw hex)
// ---------------------------------------------------------------------------

type PhaseRole = TDDPhase['role']

const ROLE_RING: Record<PhaseRole, string> = {
  danger: 'ring-danger',
  tip:    'ring-tip',
  accent: 'ring-accent',
}

const ROLE_BORDER: Record<PhaseRole, string> = {
  danger: 'border-danger',
  tip:    'border-tip',
  accent: 'border-accent',
}

const ROLE_BG_SUBTLE: Record<PhaseRole, string> = {
  danger: 'bg-danger-subtle',
  tip:    'bg-tip-subtle',
  accent: 'bg-accent-subtle',
}

const ROLE_TEXT: Record<PhaseRole, string> = {
  danger: 'text-danger',
  tip:    'text-tip',
  accent: 'text-accent',
}

const ROLE_BAR_BG: Record<PhaseRole, string> = {
  danger: 'bg-danger',
  tip:    'bg-tip',
  accent: 'bg-accent',
}

// ---------------------------------------------------------------------------
// Phase button — one of the three cycle nodes
// ---------------------------------------------------------------------------

interface PhaseButtonProps {
  phase: TDDPhase
  isActive: boolean
  onClick: (id: PhaseId) => void
  panelId: string
}

function PhaseButton({ phase, isActive, onClick, panelId }: PhaseButtonProps) {
  const handleClick = useCallback(() => onClick(phase.id), [phase.id, onClick])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick(phase.id)
      }
    },
    [phase.id, onClick],
  )

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        'flex-1 rounded border px-4 py-3 text-center transition-all',
        'focus:outline-none focus-visible:ring-2',
        ROLE_BORDER[phase.role],
        ROLE_RING[phase.role],
        isActive
          ? `${ROLE_BG_SUBTLE[phase.role]} ring-2 shadow-md`
          : 'bg-bg-elevated opacity-60 hover:opacity-90',
      ].join(' ')}
    >
      <span className={`block text-lg font-bold ${ROLE_TEXT[phase.role]}`}>
        {phase.label}
      </span>
      <span className="mt-0.5 block text-xs text-fg-muted leading-snug">
        {phase.goal.length > 55 ? `${phase.goal.slice(0, 52)}…` : phase.goal}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Agent load bar
// ---------------------------------------------------------------------------

interface AgentLoadBarProps {
  phaseId: PhaseId
  role: PhaseRole
}

function AgentLoadBar({ phaseId, role }: AgentLoadBarProps) {
  const pct = agentLoadPercent(phaseId)
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-fg-muted font-medium">Agent contribution</span>
        <span className={`font-bold tabular-nums ${ROLE_TEXT[role]}`}>{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Agent can handle ${pct}% of this phase`}
        className="h-2 w-full overflow-hidden rounded-full bg-bg"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${ROLE_BAR_BG[role]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Transition arrow label
// ---------------------------------------------------------------------------

function TransitionRow({ from, to }: { from: PhaseId; to: PhaseId }) {
  const t = TDD_TRANSITIONS.find(tr => tr.from === from && tr.to === to)
  if (t === undefined) return null
  return (
    <p className="text-xs text-fg-subtle italic">
      <span className="font-medium text-fg-muted not-italic">Condition: </span>
      {t.condition}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Detail panel for the active phase
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  phase: TDDPhase
  panelId: string
}

function DetailPanel({ phase, panelId }: DetailPanelProps) {
  const next = nextPhase(phase.id)
  const prev = prevPhase(phase.id)

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-label={`Details for ${phase.label} phase`}
      className="mt-4 rounded border border-border bg-bg p-4"
    >
      {/* Phase header */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={[
            'rounded border px-2 py-0.5 text-xs font-mono font-semibold uppercase',
            ROLE_BORDER[phase.role],
            ROLE_TEXT[phase.role],
          ].join(' ')}
        >
          {phase.id}
        </span>
        <span className="text-sm font-semibold text-fg">{phase.goal}</span>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-fg-muted">{phase.description}</p>

      {/* Human vs agent split */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Human role */}
        <div className="rounded border border-border-subtle bg-bg-subtle p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            Human
          </p>
          <p className="text-xs leading-relaxed text-fg-muted">{phase.humanRole}</p>
        </div>

        {/* Agent role */}
        <div className={`rounded border p-3 ${ROLE_BG_SUBTLE[phase.role]} ${ROLE_BORDER[phase.role]}`}>
          <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${ROLE_TEXT[phase.role]}`}>
            Agent
          </p>
          <p className="mb-2 text-xs leading-relaxed text-fg-muted">
            {phase.agentRole.action}
          </p>
          <ul className="space-y-1">
            {phase.agentRole.examples.map((ex, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-fg-subtle">
                <span className={`mt-px shrink-0 ${ROLE_TEXT[phase.role]}`}>›</span>
                <span className="italic">{ex}</span>
              </li>
            ))}
          </ul>
          <AgentLoadBar phaseId={phase.id} role={phase.role} />
        </div>
      </div>

      {/* Artefact */}
      <div className="mt-3 flex flex-wrap items-start gap-2 text-xs">
        <span className="shrink-0 font-semibold text-fg-muted">Produces:</span>
        <span className="font-mono text-fg">{phase.artefact.label}</span>
        <span className="text-fg-subtle">— {phase.artefact.note}</span>
      </div>

      {/* Transitions */}
      <div className="mt-3 space-y-1 border-t border-border-subtle pt-3">
        <TransitionRow from={prev} to={phase.id} />
        <TransitionRow from={phase.id} to={next} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cycle navigator — prev / phase indicator dots / next
// ---------------------------------------------------------------------------

interface CycleNavProps {
  activeId: PhaseId
  onPrev: () => void
  onNext: () => void
}

function CycleNav({ activeId, onPrev, onNext }: CycleNavProps) {
  const phases: PhaseId[] = ['red', 'green', 'refactor']
  return (
    <div className="mt-3 flex items-center justify-center gap-4" aria-label="Cycle navigation">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous phase"
        className="rounded px-3 py-1 text-sm text-fg-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        ‹ prev
      </button>

      <div role="group" aria-label="Phase indicators" className="flex gap-2">
        {phases.map(id => {
          const phase = TDD_PHASES.find(p => p.id === id)
          const isActive = id === activeId
          return (
            <span
              key={id}
              aria-label={`${phase?.label ?? id}${isActive ? ' (current)' : ''}`}
              className={[
                'inline-block h-2 w-2 rounded-full transition-all',
                isActive
                  ? `${ROLE_BAR_BG[phase?.role ?? 'accent']} scale-125`
                  : 'bg-border',
              ].join(' ')}
            />
          )
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        aria-label="Next phase"
        className="rounded px-3 py-1 text-sm text-fg-muted hover:text-fg transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        next ›
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function TDDLoopVisualizer() {
  const [activeId, setActiveId] = useState<PhaseId>('red')
  const panelId = useId()

  const handleSelect = useCallback((id: PhaseId) => {
    setActiveId(id)
  }, [])

  const handleNext = useCallback(() => {
    setActiveId(prev => nextPhase(prev))
  }, [])

  const handlePrev = useCallback(() => {
    setActiveId(prev => prevPhase(prev))
  }, [])

  const activePhase = TDD_PHASES.find(p => p.id === activeId) ?? TDD_PHASES[0]

  return (
    <div className="my-6 rounded-lg border border-border bg-bg-subtle p-4 not-prose">
      {/* Header */}
      <div className="mb-4">
        <span className="text-sm font-semibold text-fg">TDD Loop Visualizer</span>
        <p className="mt-0.5 text-xs text-fg-muted">
          Select a phase to see what the human and the agent each do — and how
          much of the work an AI agent can own.
        </p>
      </div>

      {/* Phase selector row */}
      <div
        role="tablist"
        aria-label="TDD phases"
        className="flex gap-2"
      >
        {TDD_PHASES.map(phase => (
          <PhaseButton
            key={phase.id}
            phase={phase}
            isActive={activeId === phase.id}
            onClick={handleSelect}
            panelId={panelId}
          />
        ))}
      </div>

      {/* Cycle flow hint */}
      <p className="mt-2 text-center text-xs text-fg-subtle">
        Red → Green → Refactor → Red …{' '}
        <span className="text-fg-subtle">(cycles until the feature is complete)</span>
      </p>

      {/* Keyboard / prev-next navigation */}
      <CycleNav activeId={activeId} onPrev={handlePrev} onNext={handleNext} />

      {/* Detail panel */}
      {activePhase !== undefined && (
        <DetailPanel phase={activePhase} panelId={panelId} />
      )}
    </div>
  )
}
