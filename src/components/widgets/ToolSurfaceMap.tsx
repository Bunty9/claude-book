'use client'

import React, { useState, useId, useCallback } from 'react'
import {
  TOOL_CATALOG,
  filterTools,
  availableSurfaces,
  type ToolSurface,
  type SortKey,
  type FilterParams,
} from '@/lib/toolCatalog'

// ── Surface badge colour mapping (token-based) ────────────────────────────────

const SURFACE_COLOUR: Record<ToolSurface, string> = {
  filesystem:    'bg-note-subtle    text-note',
  shell:         'bg-warning-subtle text-warning',
  search:        'bg-tip-subtle     text-tip',
  web:           'bg-accent-subtle  text-accent',
  agents:        'bg-danger-subtle  text-danger',
  tasks:         'bg-note-subtle    text-note',
  mcp:           'bg-tip-subtle     text-tip',
  scheduling:    'bg-warning-subtle text-warning',
  notifications: 'bg-accent-subtle  text-accent',
  notebook:      'bg-danger-subtle  text-danger',
  intelligence:  'bg-tip-subtle     text-tip',
  platform:      'bg-note-subtle    text-note',
}

// ── Small sub-components ─────────────────────────────────────────────────────

interface SurfaceBadgeProps {
  surface: ToolSurface
}

function SurfaceBadge({ surface }: SurfaceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${SURFACE_COLOUR[surface]}`}
    >
      {surface}
    </span>
  )
}

interface PermBadgeProps {
  required: boolean
}

function PermBadge({ required }: PermBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
        required
          ? 'bg-warning-subtle text-warning'
          : 'bg-bg-elevated text-fg-muted'
      }`}
      aria-label={required ? 'Permission required' : 'No permission prompt'}
    >
      {required ? 'perm' : 'silent'}
    </span>
  )
}

// ── Tool card ────────────────────────────────────────────────────────────────

interface ToolCardProps {
  tool: (typeof TOOL_CATALOG)[number]
}

function ToolCard({ tool }: ToolCardProps) {
  const [open, setOpen] = useState(false)
  const headingId = useId()

  const toggle = useCallback(() => setOpen(prev => !prev), [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    },
    [toggle],
  )

  return (
    <article
      className="rounded-lg border border-border bg-bg-subtle overflow-hidden"
      aria-labelledby={headingId}
    >
      {/* Card header — always visible */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={`detail-${headingId}`}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="flex cursor-pointer items-start gap-3 p-4 hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
      >
        {/* Tool name + badges */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id={headingId}
              className="font-mono text-sm font-semibold text-fg"
            >
              {tool.name}
            </h3>
            <SurfaceBadge surface={tool.surface} />
            <PermBadge required={tool.permissionRequired} />
          </div>
          <p className="mt-1 text-xs text-fg-muted leading-relaxed line-clamp-2">
            {tool.what}
          </p>
        </div>

        {/* Chevron */}
        <span
          aria-hidden="true"
          className={`mt-0.5 shrink-0 text-fg-subtle transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        >
          ›
        </span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div
          id={`detail-${headingId}`}
          className="border-t border-border px-4 pb-4 pt-3 grid gap-3"
        >
          <DetailRow label="When to use" value={tool.when} />
          <DetailRow label="Example" value={tool.example} mono />
          <DetailRow label="Gotcha" value={tool.gotcha} semantic="warning" />
        </div>
      )}
    </article>
  )
}

interface DetailRowProps {
  label: string
  value: string
  mono?: boolean
  semantic?: 'warning'
}

function DetailRow({ label, value, mono = false, semantic }: DetailRowProps) {
  const valueClass = [
    'text-xs leading-relaxed',
    mono ? 'font-mono text-fg' : 'text-fg-muted',
    semantic === 'warning' ? 'text-warning' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      <dt className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
        {label}
      </dt>
      <dd className={valueClass}>{value}</dd>
    </div>
  )
}

// ── Main widget ──────────────────────────────────────────────────────────────

export function ToolSurfaceMap() {
  const [query, setQuery] = useState('')
  const [surface, setSurface] = useState<ToolSurface | 'all'>('all')
  const [permFilter, setPermFilter] = useState<boolean | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name')

  const searchId = useId()
  const surfaceId = useId()
  const sortId = useId()

  const params: FilterParams = { query, surface, permissionRequired: permFilter }
  const results = filterTools(TOOL_CATALOG, params, sortKey)
  const surfaces = availableSurfaces(TOOL_CATALOG)

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    [],
  )

  const handleSurfaceChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value
      setSurface(val === 'all' ? 'all' : (val as ToolSurface))
    },
    [],
  )

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      setSortKey(e.target.value as SortKey),
    [],
  )

  const handlePermChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value
      setPermFilter(val === 'all' ? null : val === 'yes')
    },
    [],
  )

  const handleClear = useCallback(() => {
    setQuery('')
    setSurface('all')
    setPermFilter(null)
    setSortKey('name')
  }, [])

  const isFiltered = query !== '' || surface !== 'all' || permFilter !== null

  return (
    <div className="not-prose my-6 rounded-xl border border-border bg-bg p-5">
      {/* Widget header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-fg">Tool Surface Map</span>
          <span className="ml-2 text-xs text-fg-muted">
            {results.length} of {TOOL_CATALOG.length} tools
          </span>
        </div>
        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded px-2 py-1 text-xs text-fg-muted hover:text-fg hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-40">
          <label htmlFor={searchId} className="sr-only">
            Search tools
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search tools…"
            className="w-full rounded border border-border bg-bg-subtle px-3 py-1.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Search tools by name, description, or gotcha"
          />
        </div>

        {/* Surface filter */}
        <div>
          <label htmlFor={surfaceId} className="sr-only">
            Filter by surface
          </label>
          <select
            id={surfaceId}
            value={surface}
            onChange={handleSurfaceChange}
            className="rounded border border-border bg-bg-subtle px-2 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All surfaces</option>
            {surfaces.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Permission filter */}
        <div>
          <label htmlFor={`perm-${surfaceId}`} className="sr-only">
            Filter by permission
          </label>
          <select
            id={`perm-${surfaceId}`}
            value={permFilter === null ? 'all' : permFilter ? 'yes' : 'no'}
            onChange={handlePermChange}
            className="rounded border border-border bg-bg-subtle px-2 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All permissions</option>
            <option value="yes">Needs perm</option>
            <option value="no">Silent</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label htmlFor={sortId} className="sr-only">
            Sort by
          </label>
          <select
            id={sortId}
            value={sortKey}
            onChange={handleSortChange}
            className="rounded border border-border bg-bg-subtle px-2 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="name">Sort: name</option>
            <option value="surface">Sort: surface</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-1">
          {results.map(tool => (
            <ToolCard key={tool.name} tool={tool} />
          ))}
        </div>
      ) : (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-border-subtle bg-bg-subtle px-4 py-10 text-center text-sm text-fg-muted"
        >
          No tools match your filters.{' '}
          <button
            type="button"
            onClick={handleClear}
            className="underline hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border-subtle pt-3">
        <span className="text-xs text-fg-subtle font-medium">Legend:</span>
        <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
          <span className="rounded px-1.5 py-0.5 bg-warning-subtle text-warning text-xs font-medium">perm</span>
          requires user approval
        </span>
        <span className="flex items-center gap-1.5 text-xs text-fg-subtle">
          <span className="rounded px-1.5 py-0.5 bg-bg-elevated text-fg-muted text-xs font-medium">silent</span>
          runs without prompt
        </span>
        <span className="text-xs text-fg-subtle">
          Click any card to expand details.
        </span>
      </div>
    </div>
  )
}
