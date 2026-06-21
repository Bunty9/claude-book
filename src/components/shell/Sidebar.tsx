'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTrack } from '@/app/providers'
import { chaptersForTrack } from '@/content/manifest'
import { isDone } from '@/lib/progress'
import { TrackId, PartId } from '@/content/types'
import { PART_LABELS } from '@/content/parts'
import { ProgressBadge } from './ProgressBadge'

const TRACKS: TrackId[] = ['beginner', 'engineer', 'automator']

interface SidebarProps {
  onOpenSearch?: () => void
}

export function Sidebar({ onOpenSearch }: SidebarProps) {
  const { track, setTrack } = useTrack()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const chapters = chaptersForTrack(track)

  // Group by part, preserving track order
  const grouped = new Map<PartId, typeof chapters>()
  for (const ch of chapters) {
    const existing = grouped.get(ch.part)
    if (existing !== undefined) {
      existing.push(ch)
    } else {
      grouped.set(ch.part, [ch])
    }
  }

  const sidebar = (
    <nav className="w-64 shrink-0 border-r border-border bg-bg-subtle flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-border">
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide mb-2">Track</p>
        <div className="flex gap-1">
          {TRACKS.map(t => (
            <button
              key={t}
              onClick={() => setTrack(t)}
              className={[
                'flex-1 text-xs py-1 px-2 rounded capitalize transition-colors',
                t === track
                  ? 'bg-accent text-accent-fg'
                  : 'text-fg-muted hover:text-fg hover:bg-bg-elevated',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <ProgressBadge />
        </div>
        {onOpenSearch !== undefined && (
          <button
            onClick={onOpenSearch}
            className="mt-3 w-full flex items-center gap-2 px-3 py-1.5 rounded border border-border text-fg-muted text-xs hover:text-fg hover:border-fg-muted transition-colors"
            aria-label="Open search"
          >
            <span>🔍</span>
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-xs border border-border rounded px-1 py-0.5">⌘K</kbd>
          </button>
        )}
      </div>
      <div className="flex-1 py-4">
        {Array.from(grouped.entries()).map(([part, chs]) => (
          <div key={part} className="mb-4">
            <p className="px-4 mb-1 text-xs font-semibold text-fg-subtle uppercase tracking-wide">
              {PART_LABELS[part]}
            </p>
            <ul>
              {chs.map(ch => {
                const href = `/c/${ch.id}`
                const isActive = pathname === href
                const done = isDone(ch.id)
                return (
                  <li key={ch.id}>
                    <Link
                      href={href}
                      className={[
                        'flex items-center gap-2 px-4 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'text-accent bg-accent-subtle font-medium'
                          : 'text-fg-muted hover:text-fg hover:bg-bg-elevated',
                      ].join(' ')}
                    >
                      <span className={['w-3 h-3 flex-shrink-0', done ? 'text-accent' : 'text-fg-subtle'].join(' ')}>
                        {done ? '✓' : '·'}
                      </span>
                      <span className="truncate">{ch.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-bg-elevated border border-border rounded p-2 text-fg"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Sidebar — hidden on mobile unless open */}
      <div
        className={[
          'fixed top-0 left-0 z-40 h-full md:static md:block',
          open ? 'block' : 'hidden md:block',
        ].join(' ')}
      >
        {sidebar}
      </div>
    </>
  )
}
