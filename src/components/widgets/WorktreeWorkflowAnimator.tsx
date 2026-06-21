'use client'

import React, { useState, useCallback, useId, useEffect } from 'react'
import {
  WORKTREE_STEPS,
  STEP_COUNT,
  advance,
  retreat,
  jumpTo,
  isFirst,
  isLast,
  initialFlowState,
  progressLabel,
  stepAt,
  type StepRole,
  type FlowState,
} from '@/lib/worktreeFlow'

// ---------------------------------------------------------------------------
// Token-colour mapping — role → Tailwind token utilities only (no raw hex)
// ---------------------------------------------------------------------------

const ROLE_CARD_CLASSES: Record<StepRole, string> = {
  surface: 'bg-bg-elevated border-border text-fg',
  accent:  'bg-accent-subtle border-accent text-accent',
  tip:     'bg-tip-subtle border-tip text-tip',
  warning: 'bg-warning-subtle border-warning text-warning',
  note:    'bg-note-subtle border-note text-note',
  danger:  'bg-danger-subtle border-danger text-danger',
}

const ROLE_BADGE_CLASSES: Record<StepRole, string> = {
  surface: 'border-border text-fg-muted',
  accent:  'border-accent text-accent',
  tip:     'border-tip text-tip',
  warning: 'border-warning text-warning',
  note:    'border-note text-note',
  danger:  'border-danger text-danger',
}

const ROLE_DOT_CLASSES: Record<StepRole, string> = {
  surface: 'bg-fg-subtle',
  accent:  'bg-accent',
  tip:     'bg-tip',
  warning: 'bg-warning',
  note:    'bg-note',
  danger:  'bg-danger',
}

const ROLE_RING_CLASSES: Record<StepRole, string> = {
  surface: 'ring-border',
  accent:  'ring-accent',
  tip:     'ring-tip',
  warning: 'ring-warning',
  note:    'ring-note',
  danger:  'ring-danger',
}

// ---------------------------------------------------------------------------
// StepDot — compact progress indicator
// ---------------------------------------------------------------------------

interface StepDotProps {
  index: number
  currentIndex: number
  role: StepRole
  onClick: (index: number) => void
  label: string
}

function StepDot({ index, currentIndex, role, onClick, label }: StepDotProps) {
  const isPast    = index < currentIndex
  const isCurrent = index === currentIndex

  const handleClick = useCallback(() => onClick(index), [index, onClick])
  const handleKey   = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick(index)
      }
    },
    [index, onClick],
  )

  const dotBase = ROLE_DOT_CLASSES[role]
  const ringBase = ROLE_RING_CLASSES[role]

  return (
    <button
      type="button"
      aria-label={`Go to ${label}`}
      aria-current={isCurrent ? 'step' : undefined}
      onClick={handleClick}
      onKeyDown={handleKey}
      className={[
        'relative h-3 w-3 rounded-full transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        isCurrent
          ? `${dotBase} scale-125 ring-2 ring-offset-1 ${ringBase}`
          : isPast
            ? `${dotBase} opacity-60`
            : 'bg-border opacity-40',
      ].join(' ')}
    />
  )
}

// ---------------------------------------------------------------------------
// NavButton — prev / next
// ---------------------------------------------------------------------------

interface NavButtonProps {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}

function NavButton({ direction, disabled, onClick }: NavButtonProps) {
  const label = direction === 'prev' ? '← Previous' : 'Next →'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'rounded border px-3 py-1.5 text-sm font-medium transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        disabled
          ? 'border-border text-fg-subtle opacity-40 cursor-not-allowed'
          : 'border-border text-fg hover:border-accent hover:text-accent',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// CommandBlock — shell command display
// ---------------------------------------------------------------------------

interface CommandBlockProps {
  command: string
}

function CommandBlock({ command }: CommandBlockProps) {
  return (
    <div className="mt-3 rounded border border-code-border bg-code-bg px-3 py-2 font-mono text-xs text-fg">
      <span className="select-none text-fg-subtle">$ </span>
      {command}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PitfallBlock — anti-pattern callout
// ---------------------------------------------------------------------------

interface PitfallBlockProps {
  pitfall: string
}

function PitfallBlock({ pitfall }: PitfallBlockProps) {
  return (
    <div className="mt-3 flex gap-2 rounded border border-danger bg-danger-subtle px-3 py-2.5 text-xs text-danger">
      <span className="shrink-0 font-bold" aria-hidden="true">!</span>
      <p className="leading-snug">{pitfall}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function WorktreeWorkflowAnimator() {
  const [flowState, setFlowState] = useState<FlowState>(initialFlowState)
  const panelId = useId()
  const headingId = useId()

  const currentStep = stepAt(flowState.currentIndex)

  const handleAdvance  = useCallback(() => setFlowState(s => advance(s)), [])
  const handleRetreat  = useCallback(() => setFlowState(s => retreat(s)), [])
  const handleJump     = useCallback((i: number) => setFlowState(s => jumpTo(s, i)), [])

  // Keyboard shortcut: ArrowRight / ArrowLeft navigate steps
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Only fire if no focusable input is active
      const active = document.activeElement
      const tag = active instanceof HTMLElement ? active.tagName : ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setFlowState(s => advance(s))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setFlowState(s => retreat(s))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (currentStep === undefined) return null

  const cardClass  = ROLE_CARD_CLASSES[currentStep.role]
  const badgeClass = ROLE_BADGE_CLASSES[currentStep.role]
  const atFirst    = isFirst(flowState)
  const atLast     = isLast(flowState)

  return (
    <div
      className="my-6 rounded-lg border border-border bg-bg-subtle p-4 not-prose"
      aria-labelledby={headingId}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <span id={headingId} className="text-sm font-semibold text-fg">
            Worktree Workflow
          </span>
          <p className="mt-0.5 text-xs text-fg-muted">
            Step through the feature-per-worktree development flow.
          </p>
        </div>
        <span className="shrink-0 text-xs text-fg-subtle tabular-nums">
          {progressLabel(flowState)}
        </span>
      </div>

      {/* Progress dots */}
      <div
        role="group"
        aria-label="Workflow steps"
        className="mb-4 flex items-center justify-center gap-2"
      >
        {WORKTREE_STEPS.map((step, i) => (
          <StepDot
            key={step.id}
            index={i}
            currentIndex={flowState.currentIndex}
            role={step.role}
            onClick={handleJump}
            label={step.title}
          />
        ))}
      </div>

      {/* Step card */}
      <div
        id={panelId}
        role="region"
        aria-live="polite"
        aria-label={`Step detail: ${currentStep.title}`}
        className={[
          'rounded-lg border p-4 transition-colors duration-200',
          cardClass,
        ].join(' ')}
      >
        {/* Step badge + title */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={[
              'rounded border px-2 py-0.5 font-mono text-xs font-medium',
              badgeClass,
            ].join(' ')}
          >
            {flowState.currentIndex + 1}/{STEP_COUNT}
          </span>
          <span className="text-sm font-semibold leading-snug">{currentStep.title}</span>
        </div>

        {/* Summary */}
        <p className="mb-1 text-xs font-medium opacity-80">{currentStep.summary}</p>

        {/* Description */}
        <p className="text-sm leading-relaxed opacity-90">{currentStep.description}</p>

        {/* Command */}
        {currentStep.command !== null && (
          <CommandBlock command={currentStep.command} />
        )}

        {/* Pitfall */}
        {currentStep.pitfall !== null && (
          <PitfallBlock pitfall={currentStep.pitfall} />
        )}
      </div>

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <NavButton direction="prev" disabled={atFirst} onClick={handleRetreat} />

        <p className="text-center text-xs text-fg-subtle">
          {atFirst
            ? 'Use → or the button to step through the workflow.'
            : atLast
              ? 'End of workflow — the cycle begins again from step 1.'
              : 'Use ← → arrow keys or the buttons to navigate.'}
        </p>

        <NavButton direction="next" disabled={atLast} onClick={handleAdvance} />
      </div>
    </div>
  )
}
