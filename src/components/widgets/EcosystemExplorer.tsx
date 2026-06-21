'use client'

import React, { useId, useState } from 'react'
import {
  ECOSYSTEM_ITEMS,
  filterItems,
  typeLabel,
  useCaseLabel,
  typeBadgeClasses,
  ALL_TYPES,
  ALL_USE_CASES,
  DEFAULT_FILTERS,
  type EcosystemFilters,
  type ItemType,
  type UseCase,
} from '@/lib/ecosystem'

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ type }: { type: ItemType }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold leading-none ${typeBadgeClasses(type)}`}
    >
      {typeLabel(type)}
    </span>
  )
}

function NewBadge() {
  return (
    <span className="inline-block rounded px-1.5 py-0.5 text-xs font-semibold leading-none bg-tip-subtle text-tip">
      New
    </span>
  )
}

interface ItemCardProps {
  id: string
  name: string
  type: ItemType
  description: string
  installHint: string | null
  url: string
  isNew: boolean
}

function ItemCard({ id, name, type, description, installHint, url, isNew }: ItemCardProps) {
  return (
    <article
      aria-labelledby={`eco-item-${id}`}
      className="flex flex-col gap-2 rounded-lg border border-border bg-bg-subtle p-4 transition-colors hover:border-accent/50"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          id={`eco-item-${id}`}
          className="font-semibold text-fg text-sm"
        >
          {name}
        </span>
        <Badge type={type} />
        {isNew && <NewBadge />}
      </div>

      <p className="text-xs text-fg-muted leading-relaxed">{description}</p>

      {installHint !== null && (
        <div className="mt-1">
          <code className="rounded bg-code-bg border border-code-border px-2 py-1 text-xs text-fg font-mono select-all">
            {installHint}
          </code>
        </div>
      )}

      <div className="mt-auto pt-1">
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
          aria-label={`Open ${name} documentation in new tab`}
        >
          Docs / Source
          <svg
            aria-hidden="true"
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="shrink-0"
          >
            <path
              d="M1.5 8.5L8.5 1.5M8.5 1.5H4M8.5 1.5V6"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </article>
  )
}

// ── Select helper ─────────────────────────────────────────────────────────────

interface SelectProps<T extends string> {
  label: string
  id: string
  value: T
  options: T[]
  labelFn: (v: T) => string
  onChange: (v: T) => void
}

function Select<T extends string>({
  label,
  id,
  value,
  options,
  labelFn,
  onChange,
}: SelectProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-fg-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="rounded border border-border bg-bg px-2 py-1.5 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>
            {labelFn(opt)}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function EcosystemExplorer() {
  const uid = useId()
  const [filters, setFilters] = useState<EcosystemFilters>(DEFAULT_FILTERS)

  const results = filterItems(ECOSYSTEM_ITEMS, filters)

  function setType(type: ItemType | 'all') {
    setFilters(f => ({ ...f, type }))
  }

  function setUseCase(useCase: UseCase | 'all') {
    setFilters(f => ({ ...f, useCase }))
  }

  function setQuery(query: string) {
    setFilters(f => ({ ...f, query }))
  }

  function toggleNewOnly() {
    setFilters(f => ({ ...f, newOnly: !f.newOnly }))
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  const hasActiveFilter =
    filters.type !== 'all' ||
    filters.useCase !== 'all' ||
    filters.query.trim().length > 0 ||
    filters.newOnly

  return (
    <div className="my-6 rounded-xl border border-border bg-bg not-prose" role="region" aria-label="Ecosystem Explorer">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <span className="font-semibold text-fg">Ecosystem Explorer</span>
          <span className="ml-2 text-xs text-fg-subtle">
            {ECOSYSTEM_ITEMS.length} items — plugins, MCP servers, skills, repos
          </span>
        </div>
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="text-xs text-fg-muted hover:text-fg underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
            type="button"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex flex-col gap-1 min-w-48 flex-1">
            <label htmlFor={`${uid}-search`} className="text-xs font-medium text-fg-muted">
              Search
            </label>
            <input
              id={`${uid}-search`}
              type="search"
              value={filters.query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Filter by name or description…"
              className="rounded border border-border bg-bg px-2 py-1.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="Search ecosystem items"
            />
          </div>

          {/* Type filter */}
          <Select<ItemType | 'all'>
            label="Type"
            id={`${uid}-type`}
            value={filters.type}
            options={ALL_TYPES}
            labelFn={typeLabel}
            onChange={setType}
          />

          {/* Use-case filter */}
          <Select<UseCase | 'all'>
            label="Use case"
            id={`${uid}-usecase`}
            value={filters.useCase}
            options={ALL_USE_CASES}
            labelFn={useCaseLabel}
            onChange={setUseCase}
          />

          {/* New-only toggle */}
          <div className="flex items-center gap-2 pb-0.5">
            <input
              id={`${uid}-newonly`}
              type="checkbox"
              checked={filters.newOnly}
              onChange={toggleNewOnly}
              className="rounded border border-border accent-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            />
            <label htmlFor={`${uid}-newonly`} className="text-sm text-fg-muted cursor-pointer select-none">
              New / featured only
            </label>
          </div>
        </div>
      </div>

      {/* Result count */}
      <div className="px-4 pt-3 pb-1">
        <p
          className="text-xs text-fg-subtle"
          aria-live="polite"
          aria-atomic="true"
        >
          {results.length === ECOSYSTEM_ITEMS.length
            ? `Showing all ${results.length} items`
            : `${results.length} of ${ECOSYSTEM_ITEMS.length} items`}
        </p>
      </div>

      {/* Grid */}
      {results.length > 0 ? (
        <div
          className="grid gap-3 p-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Ecosystem items"
        >
          {results.map(item => (
            <div key={item.id} role="listitem">
              <ItemCard
                id={item.id}
                name={item.name}
                type={item.type}
                description={item.description}
                installHint={item.installHint}
                url={item.url}
                isNew={item.isNew}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-10 text-center" role="status">
          <p className="text-sm text-fg-muted">No items match your filters.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-xs text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
            type="button"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
