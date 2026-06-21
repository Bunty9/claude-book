'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTrack } from '@/app/providers'
import { chaptersForTrack } from '@/content/manifest'
import { isDone, useProgressVersion } from '@/lib/progress'
import { TrackId, PartId } from '@/content/types'
import { PART_LABELS } from '@/content/parts'
import { ProgressBadge } from './ProgressBadge'
import { useMounted } from '@/lib/useMounted'

const TRACKS: TrackId[] = ['beginner', 'engineer', 'automator']

interface SidebarProps {
  onOpenSearch?: () => void
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6.5" cy="6.5" r="4" />
      <line x1="10" y1="10" x2="14" y2="14" />
    </svg>
  )
}

function DoneIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="6" fill="currentColor" />
      <polyline
        points="3.5,6.2 5.2,7.9 8.5,4.5"
        stroke="var(--accent-fg)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

function NotDoneIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="5" />
    </svg>
  )
}

function SidebarContent({ onOpenSearch }: SidebarProps) {
  const { track, setTrack } = useTrack()
  const pathname = usePathname()
  const mounted = useMounted()
  useProgressVersion()
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

  return (
    <nav className="w-[17rem] shrink-0 border-r border-border bg-bg-subtle flex flex-col h-full overflow-y-auto">
      {/* Book title header band */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-fg-subtle tracking-wide">Claude, End to End</p>
      </div>

      {/* Track switcher + search */}
      <div className="px-4 pb-4 border-b border-border">
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide mb-2">Track</p>
        {/* Segmented control */}
        <div className="flex rounded border border-border overflow-hidden">
          {TRACKS.map(t => (
            <button
              key={t}
              onClick={() => setTrack(t)}
              className={[
                'flex-1 text-xs py-1.5 px-1 capitalize transition-colors',
                t === (mounted ? track : 'beginner')
                  ? 'bg-accent text-accent-fg font-medium'
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
            <SearchIcon />
            <span className="flex-1 text-left">Search</span>
            <kbd className="text-xs border border-border rounded px-1 py-0.5">⌘K</kbd>
          </button>
        )}
      </div>

      {/* Chapter list */}
      <div className="flex-1 py-4 pb-8">
        {Array.from(grouped.entries()).map(([part, chs]) => (
          <div key={part} className="mb-4">
            <p className="px-4 mb-1 text-xs font-semibold text-fg-subtle uppercase tracking-wide">
              {PART_LABELS[part]}
            </p>
            <ul>
              {chs.map(ch => {
                const href = `/c/${ch.id}`
                const isActive = pathname === href
                const done = mounted && isDone(ch.id)
                return (
                  <li key={ch.id}>
                    <Link
                      href={href}
                      className={[
                        'flex items-center gap-2 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'border-l-2 border-accent text-accent bg-accent-subtle font-medium pl-[calc(1rem-2px)] pr-4'
                          : 'text-fg-muted hover:text-fg hover:bg-bg-elevated pl-4 pr-4',
                      ].join(' ')}
                    >
                      <span className={[
                        'w-3 h-3 flex-shrink-0 flex items-center justify-center',
                        done ? 'text-accent' : 'text-fg-subtle',
                      ].join(' ')}>
                        {done ? <DoneIcon /> : <NotDoneIcon />}
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
}

export function Sidebar({ onOpenSearch }: SidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-bg-elevated border border-border rounded p-2 text-fg"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar — fixed overlay */}
      <div
        className={[
          'fixed top-0 left-0 z-40 h-full md:hidden',
          open ? 'block' : 'hidden',
        ].join(' ')}
      >
        <SidebarContent onOpenSearch={onOpenSearch} />
      </div>

      {/* Desktop sidebar — sticky in the flex layout */}
      <div className="hidden md:block sticky top-0 h-[100dvh] shrink-0">
        <SidebarContent onOpenSearch={onOpenSearch} />
      </div>
    </>
  )
}
