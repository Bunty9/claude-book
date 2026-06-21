'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MiniSearch from 'minisearch'
import { buildIndex, search, SearchHit } from '@/lib/searchIndex'
import { loadSearchDocs } from '@/lib/searchData'
import { PART_LABELS } from '@/content/parts'
import { PartId } from '@/content/types'

function isPartId(s: string): s is PartId {
  return Object.prototype.hasOwnProperty.call(PART_LABELS, s)
}

// ---------------------------------------------------------------------------
// Index cache — loaded once per session on first palette open
// ---------------------------------------------------------------------------

let cachedIndex: MiniSearch | null = null

async function getIndex(): Promise<MiniSearch> {
  if (cachedIndex !== null) return cachedIndex
  const docs = await loadSearchDocs()
  const idx = buildIndex(docs)
  // Only cache if at least one doc has a non-empty body (i.e., fetch succeeded)
  if (docs.some(d => d.body.length > 0)) {
    cachedIndex = idx
  }
  return idx
}

// ---------------------------------------------------------------------------
// Inner palette (stateful search UI; accepts a stable onClose/onNavigate)
// ---------------------------------------------------------------------------

interface PaletteInnerProps {
  onClose: () => void
  onNavigate: (id: string) => void
}

function PaletteInner({ onClose, onNavigate }: PaletteInnerProps) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx(i => Math.min(i + 1, hits.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && hits.length > 0) {
        const hit = hits[activeIdx]
        if (hit !== undefined) onNavigate(hit.id)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [hits, activeIdx, onClose, onNavigate])

  // Async search — setState only from async callback, satisfying the rule
  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    setActiveIdx(0)

    if (q.trim() === '') {
      setHits([])
      return
    }

    void getIndex().then(idx => {
      const results = search(idx, q)
      setHits(results.slice(0, 8))
    }).catch(() => {
      setHits([])
    })
  }

  return (
    <div
      className="w-full max-w-lg bg-bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center px-4 border-b border-border">
        <span className="text-fg-muted mr-2 text-sm" aria-hidden="true">🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search chapters…"
          value={query}
          onChange={handleQueryChange}
          className="flex-1 py-4 bg-transparent text-fg placeholder-fg-muted outline-none text-sm"
          aria-label="Search chapters"
        />
        <kbd className="hidden sm:inline-flex text-xs text-fg-muted border border-border rounded px-1.5 py-0.5 ml-2">
          Esc
        </kbd>
      </div>

      {hits.length > 0 && (
        <ul role="listbox" className="py-2 max-h-80 overflow-y-auto">
          {hits.map((hit, i) => {
            const partLabel = isPartId(hit.part) ? PART_LABELS[hit.part] : hit.part
            return (
              <li
                key={hit.id}
                role="option"
                aria-selected={i === activeIdx}
                className={[
                  'flex flex-col px-4 py-2.5 cursor-pointer transition-colors text-sm',
                  i === activeIdx
                    ? 'bg-accent-subtle text-accent'
                    : 'text-fg hover:bg-bg-subtle',
                ].join(' ')}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => onNavigate(hit.id)}
              >
                <span className="font-medium truncate">{hit.title}</span>
                <span className="text-xs text-fg-muted truncate mt-0.5">
                  {partLabel} · {hit.summary}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {query.trim() !== '' && hits.length === 0 && (
        <div className="px-4 py-6 text-center text-fg-muted text-sm">
          No chapters found for &ldquo;{query}&rdquo;
        </div>
      )}

      {query.trim() === '' && (
        <div className="px-4 py-4 text-center text-fg-muted text-xs">
          Type to search chapters
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SearchPalette — outer shell.
// `if (!open) return null` unmounts PaletteInner on close, so it remounts
// fresh on each open with clean state — no instanceKey needed.
// ---------------------------------------------------------------------------

interface SearchPaletteProps {
  open: boolean
  onClose: () => void
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const router = useRouter()

  const navigate = useCallback((id: string) => {
    router.push(`/c/${id}`)
    onClose()
  }, [router, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60"
      role="dialog"
      aria-label="Search"
      aria-modal="true"
      onClick={onClose}
    >
      <PaletteInner onClose={onClose} onNavigate={navigate} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hook for ⌘K / Ctrl+K shortcut
// ---------------------------------------------------------------------------

export function useSearchPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return { open, setOpen }
}
