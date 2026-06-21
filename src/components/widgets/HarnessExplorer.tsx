'use client'

import React, { useState, useCallback, useId } from 'react'
import {
  HARNESS_NODES,
  HARNESS_EDGES,
  type HarnessNode,
  type NodeId,
} from '@/lib/harnessGraph'

// ---------------------------------------------------------------------------
// Token-colour mapping — role → Tailwind token utilities only (no raw hex)
// ---------------------------------------------------------------------------

const ROLE_NODE_CLASSES: Record<HarnessNode['role'], string> = {
  surface: 'bg-bg-elevated border-border text-fg',
  accent:  'bg-accent-subtle border-accent text-accent',
  tip:     'bg-tip-subtle border-tip text-tip',
  warning: 'bg-warning-subtle border-warning text-warning',
  note:    'bg-note-subtle border-note text-note',
}

const ROLE_BADGE_CLASSES: Record<HarnessNode['role'], string> = {
  surface: 'border-border text-fg-muted',
  accent:  'border-accent text-accent',
  tip:     'border-tip text-tip',
  warning: 'border-warning text-warning',
  note:    'border-note text-note',
}

const ROLE_RING_CLASSES: Record<HarnessNode['role'], string> = {
  surface: 'ring-border',
  accent:  'ring-accent',
  tip:     'ring-tip',
  warning: 'ring-warning',
  note:    'ring-note',
}

// ---------------------------------------------------------------------------
// Layout — six nodes arranged in a two-column flow that mirrors the loop
//
// We use a simple CSS grid / flex layout (no SVG positioning needed for nodes).
// Edges are described textually in the info panel to keep the component
// accessible and avoid complex SVG path arithmetic.
// ---------------------------------------------------------------------------

// Visual order matches the loop flow: top-to-bottom left column, then bottom-to-top right.
const LAYOUT_ORDER: NodeId[] = [
  'context',
  'model',
  'tool-call',
  'tool-result',
  'loop-check',
  'result',
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface NodeButtonProps {
  node: HarnessNode
  isSelected: boolean
  onClick: (id: NodeId) => void
  descriptionId: string
}

function NodeButton({ node, isSelected, onClick, descriptionId }: NodeButtonProps) {
  const handleClick = useCallback(() => onClick(node.id), [node.id, onClick])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick(node.id)
      }
    },
    [node.id, onClick],
  )

  const colourClass = ROLE_NODE_CLASSES[node.role]
  const ringClass   = ROLE_RING_CLASSES[node.role]

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={descriptionId}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        'w-full rounded border px-3 py-2.5 text-left text-sm font-medium transition-all',
        'focus:outline-none focus-visible:ring-2',
        colourClass,
        ringClass,
        isSelected
          ? 'ring-2 shadow-md'
          : 'opacity-80 hover:opacity-100',
      ].join(' ')}
    >
      <span className="block truncate">{node.label}</span>
      <span className="mt-0.5 block text-xs font-normal opacity-70 leading-snug line-clamp-2">
        {node.summary}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Edge list for a given node — shown in the detail panel
// ---------------------------------------------------------------------------

interface EdgeListProps {
  selectedId: NodeId
}

function EdgeList({ selectedId }: EdgeListProps) {
  const outgoing = HARNESS_EDGES.filter(e => e.from === selectedId)
  const incoming = HARNESS_EDGES.filter(e => e.to   === selectedId)

  if (outgoing.length === 0 && incoming.length === 0) return null

  return (
    <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
      {incoming.length > 0 && (
        <div>
          <p className="mb-1.5 font-semibold uppercase tracking-wide text-fg-subtle">
            Receives from
          </p>
          <ul className="space-y-1">
            {incoming.map(e => {
              const fromNode = HARNESS_NODES.find(n => n.id === e.from)
              return (
                <li key={`${e.from}-${e.to}`} className="flex items-center gap-1.5 text-fg-muted">
                  <span className="shrink-0 text-fg-subtle">←</span>
                  <span className="font-medium text-fg">{fromNode?.label ?? e.from}</span>
                  <span className="text-fg-subtle">({e.label})</span>
                  {e.isLoop && (
                    <span className="ml-1 rounded border border-note px-1 py-px text-note">
                      loop
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {outgoing.length > 0 && (
        <div>
          <p className="mb-1.5 font-semibold uppercase tracking-wide text-fg-subtle">
            Passes to
          </p>
          <ul className="space-y-1">
            {outgoing.map(e => {
              const toNode = HARNESS_NODES.find(n => n.id === e.to)
              return (
                <li key={`${e.from}-${e.to}`} className="flex items-center gap-1.5 text-fg-muted">
                  <span className="shrink-0 text-fg-subtle">→</span>
                  <span className="font-medium text-fg">{toNode?.label ?? e.to}</span>
                  <span className="text-fg-subtle">({e.label})</span>
                  {e.isLoop && (
                    <span className="ml-1 rounded border border-note px-1 py-px text-note">
                      loop
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function HarnessExplorer() {
  const [selectedId, setSelectedId] = useState<NodeId | null>(null)
  const panelId = useId()

  const handleSelect = useCallback((id: NodeId) => {
    setSelectedId(prev => (prev === id ? null : id))
  }, [])

  const selectedNode = selectedId !== null
    ? HARNESS_NODES.find(n => n.id === selectedId) ?? null
    : null

  // Ordered nodes for display
  const orderedNodes = LAYOUT_ORDER
    .map(id => HARNESS_NODES.find(n => n.id === id))
    .filter((n): n is HarnessNode => n !== undefined)

  return (
    <div className="my-6 rounded-lg border border-border bg-bg-subtle p-4 not-prose">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-fg">Agent Loop Explorer</span>
          <p className="mt-0.5 text-xs text-fg-muted">
            Click a phase to see how it fits into the Claude Code harness.
          </p>
        </div>
        {selectedId !== null && (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="shrink-0 text-xs text-fg-subtle hover:text-fg transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-1"
            aria-label="Clear selection"
          >
            ✕ clear
          </button>
        )}
      </div>

      {/* Node grid */}
      <div
        role="tablist"
        aria-label="Agent loop phases"
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        {orderedNodes.map(node => (
          <NodeButton
            key={node.id}
            node={node}
            isSelected={selectedId === node.id}
            onClick={handleSelect}
            descriptionId={panelId}
          />
        ))}
      </div>

      {/* Flow hint */}
      <p className="mt-3 text-center text-xs text-fg-subtle">
        context → model → tool dispatch → results → loop check → (repeat or done)
      </p>

      {/* Detail panel */}
      {selectedNode !== null && (
        <div
          id={panelId}
          role="tabpanel"
          aria-label={`Details for ${selectedNode.label}`}
          className="mt-4 rounded border border-border bg-bg p-4"
        >
          {/* Title row */}
          <div className="mb-2 flex items-center gap-2">
            <span
              className={[
                'rounded border px-2 py-0.5 text-xs font-mono font-medium',
                ROLE_BADGE_CLASSES[selectedNode.role],
              ].join(' ')}
            >
              {selectedNode.id}
            </span>
            <span className="text-sm font-semibold text-fg">{selectedNode.label}</span>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-fg-muted">
            {selectedNode.description}
          </p>

          {/* Connected edges */}
          <EdgeList selectedId={selectedNode.id} />
        </div>
      )}

      {/* Empty state when nothing selected */}
      {selectedNode === null && (
        <p className="mt-4 text-center text-xs text-fg-subtle italic">
          Select a phase above to read its description and connections.
        </p>
      )}
    </div>
  )
}
