'use client'

import React, { useId, useState } from 'react'
import {
  answer,
  getNode,
  getRecommendation,
  resetState,
  type Choice,
  type QuestionNode,
  type RecommendationNode,
  type TreeState,
} from '@/lib/decisionTree'

// ---------------------------------------------------------------------------
// Category → token colour mapping (no hardcoded hex)
// ---------------------------------------------------------------------------

const CATEGORY_CLASSES: Record<string, { badge: string; icon: string }> = {
  agent:      { badge: 'bg-accent-subtle text-accent border-accent/30',     icon: '🤖' },
  automation: { badge: 'bg-tip-subtle text-tip border-tip/30',              icon: '⚙️' },
  hook:       { badge: 'bg-warning-subtle text-warning border-warning/30',  icon: '🔔' },
  skill:      { badge: 'bg-note-subtle text-note border-note/30',           icon: '📋' },
  tool:       { badge: 'bg-danger-subtle text-danger border-danger/30',     icon: '🔌' },
  prompt:     { badge: 'bg-bg-elevated text-fg-muted border-border',        icon: '💬' },
  style:      { badge: 'bg-accent-subtle text-accent border-accent/30',     icon: '✨' },
}

function categoryCls(category: string): { badge: string; icon: string } {
  return CATEGORY_CLASSES[category] ?? CATEGORY_CLASSES['prompt'] ?? { badge: 'bg-bg-elevated text-fg-muted border-border', icon: '💬' }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ProgressDotsProps {
  total: number
  current: number
}

function ProgressDots({ total, current }: ProgressDotsProps) {
  if (total === 0) return null
  return (
    <div className="flex items-center gap-1" aria-label={`Step ${current} of approximately ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`inline-block rounded-full transition-all duration-200 ${
            i < current
              ? 'w-2 h-2 bg-accent'
              : i === current
              ? 'w-2 h-2 bg-accent/50'
              : 'w-1.5 h-1.5 bg-border'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

interface ChoiceButtonProps {
  choice: Choice
  onSelect: (nextId: string) => void
  describedById: string
}

function ChoiceButton({ choice, onSelect, describedById }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(choice.nextId)}
      aria-describedby={choice.hint !== undefined ? describedById : undefined}
      className={[
        'group w-full text-left rounded-md border border-border bg-bg px-4 py-3',
        'text-sm text-fg transition-colors duration-100',
        'hover:border-accent/60 hover:bg-bg-subtle',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'active:scale-[0.99]',
      ].join(' ')}
    >
      <span className="font-medium leading-snug">{choice.label}</span>
      {choice.hint !== undefined && (
        <span id={describedById} className="mt-0.5 block text-xs text-fg-subtle leading-relaxed">
          {choice.hint}
        </span>
      )}
    </button>
  )
}

interface QuestionPanelProps {
  node: QuestionNode
  state: TreeState
  onSelect: (nextId: string) => void
  onBack: (() => void) | null
  headingId: string
}

function QuestionPanel({ node, state, onSelect, onBack, headingId }: QuestionPanelProps) {
  // Estimate rough "depth" for progress display — BFS depth from root is 4 at most
  const ESTIMATED_DEPTH = 4
  const stepsDone = state.history.length

  return (
    <div>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <ProgressDots total={ESTIMATED_DEPTH} current={stepsDone} />
        {onBack !== null && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 text-xs text-fg-muted hover:text-fg focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-1"
            aria-label="Go back to previous question"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Question */}
      <h3 id={headingId} className="mt-3 text-base font-semibold text-fg leading-snug">
        {node.question}
      </h3>
      {node.subtext !== undefined && (
        <p className="mt-1 text-xs text-fg-muted leading-relaxed">{node.subtext}</p>
      )}

      {/* Choices */}
      <div
        className="mt-4 flex flex-col gap-2"
        role="group"
        aria-labelledby={headingId}
      >
        {node.choices.map((choice, idx) => {
          // Each hint needs its own id; derive from heading + index
          const hintId = `${headingId}-hint-${idx}`
          return (
            <ChoiceButton
              key={choice.nextId}
              choice={choice}
              onSelect={onSelect}
              describedById={hintId}
            />
          )
        })}
      </div>
    </div>
  )
}

interface RecommendationPanelProps {
  rec: RecommendationNode
  onReset: () => void
  headingId: string
}

function RecommendationPanel({ rec, onReset, headingId }: RecommendationPanelProps) {
  const { badge, icon } = categoryCls(rec.category)

  return (
    <div>
      {/* Badge + title */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${badge}`}
          aria-label={`Category: ${rec.category}`}
        >
          <span aria-hidden="true">{icon}</span>
          {rec.category}
        </span>
      </div>

      <h3 id={headingId} className="text-lg font-bold text-fg leading-tight">
        {rec.title}
      </h3>

      <p className="mt-2 text-sm text-fg-muted leading-relaxed">{rec.body}</p>

      {/* How-to */}
      <div className="mt-4 rounded-md border border-border bg-bg-elevated px-4 py-3">
        <p className="text-[0.7rem] uppercase tracking-widest text-fg-subtle font-semibold mb-1">
          How to start
        </p>
        <p className="text-sm text-fg leading-relaxed">{rec.howTo}</p>
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={onReset}
        className={[
          'mt-5 w-full rounded-md border border-border bg-bg px-4 py-2.5',
          'text-sm font-medium text-fg-muted hover:border-accent/60 hover:text-fg',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          'transition-colors duration-100',
        ].join(' ')}
        aria-label="Start the decision tree over"
      >
        ↺ Start over
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Breadcrumb trail
// ---------------------------------------------------------------------------

interface BreadcrumbTrailProps {
  state: TreeState
  onJump: (idx: number) => void
}

function BreadcrumbTrail({ state, onJump }: BreadcrumbTrailProps) {
  if (state.history.length === 0) return null

  return (
    <nav
      aria-label="Decision path"
      className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center gap-x-1 gap-y-1 text-[0.68rem] text-fg-subtle"
    >
      <span className="font-medium text-fg-muted">Path:</span>
      {state.history.map((entry, idx) => {
        const node = getNode(entry.nodeId)
        const chosenNode = getNode(entry.chosenNextId)
        const label = node?.kind === 'question'
          ? node.choices.find(c => c.nextId === entry.chosenNextId)?.label ?? entry.chosenNextId
          : entry.chosenNextId
        const isCurrent = idx === state.history.length - 1
        return (
          <React.Fragment key={`${entry.nodeId}-${idx}`}>
            {idx > 0 && <span aria-hidden="true" className="text-border">›</span>}
            {isCurrent || chosenNode?.kind === 'recommendation' ? (
              <span className={isCurrent ? 'text-accent font-medium' : ''}>{label}</span>
            ) : (
              <button
                type="button"
                onClick={() => onJump(idx)}
                className="underline underline-offset-2 hover:text-fg focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
                aria-label={`Jump back to: ${label}`}
              >
                {label}
              </button>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function DecisionTrees() {
  const widgetId = useId()
  const headingId = `${widgetId}-heading`
  const titleId = `${widgetId}-title`

  const [state, setState] = useState<TreeState>(() => resetState())

  const currentNode = getNode(state.currentId)
  const recommendation = getRecommendation(state)

  function handleSelect(nextId: string) {
    setState(prev => answer(prev, nextId))
  }

  function handleBack() {
    if (state.history.length === 0) return
    const prev = state.history[state.history.length - 1]
    if (prev === undefined) return
    setState({
      currentId: prev.nodeId,
      history: state.history.slice(0, -1),
    })
  }

  function handleReset() {
    setState(resetState())
  }

  /** Jump back to a specific step in history (re-ask from that point). */
  function handleJump(historyIdx: number) {
    const entry = state.history[historyIdx]
    if (entry === undefined) return
    setState({
      currentId: entry.nodeId,
      history: state.history.slice(0, historyIdx),
    })
  }

  const canGoBack = state.history.length > 0

  return (
    <section
      className="my-6 rounded-lg border border-border bg-bg-subtle p-5 not-prose"
      aria-labelledby={titleId}
    >
      {/* Widget header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <p
            id={titleId}
            className="text-xs uppercase tracking-widest font-semibold text-fg-subtle"
          >
            Decision Guide
          </p>
          <p className="text-[0.7rem] text-fg-subtle italic mt-0.5">
            Which Claude Code mechanism should I use?
          </p>
        </div>
        {canGoBack && recommendation === undefined && (
          <span className="text-[0.65rem] text-fg-subtle tabular-nums">
            {state.history.length} answer{state.history.length !== 1 ? 's' : ''} in
          </span>
        )}
      </div>

      {/* Main panel */}
      {currentNode === undefined ? (
        <p className="text-sm text-danger">Tree node not found — please reset.</p>
      ) : recommendation !== undefined ? (
        <RecommendationPanel
          rec={recommendation}
          onReset={handleReset}
          headingId={headingId}
        />
      ) : currentNode.kind === 'question' ? (
        <QuestionPanel
          node={currentNode}
          state={state}
          onSelect={handleSelect}
          onBack={canGoBack ? handleBack : null}
          headingId={headingId}
        />
      ) : null}

      {/* Breadcrumb trail */}
      <BreadcrumbTrail state={state} onJump={handleJump} />
    </section>
  )
}
