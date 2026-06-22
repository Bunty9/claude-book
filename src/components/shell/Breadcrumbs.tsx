import React from 'react'
import Link from 'next/link'
import { PartId } from '@/content/types'
import { PART_LABELS } from '@/content/parts'

interface BreadcrumbsProps {
  part: PartId
  title: string
  /** Compact variant for the sticky header: smaller text, no bottom margin. */
  compact?: boolean
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="text-fg-subtle shrink-0">
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function Breadcrumbs({ part, title, compact = false }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={[
        'flex items-center flex-wrap gap-1.5 text-fg-muted',
        compact ? 'text-xs' : 'text-sm mb-4',
      ].join(' ')}
    >
      <Link href="/" className="hover:text-fg transition-colors shrink-0">Home</Link>
      <span className="hidden sm:contents">
        <ChevronRight />
        <span className="text-fg-muted truncate max-w-[8rem]">{PART_LABELS[part]}</span>
      </span>
      <ChevronRight />
      <span className="text-fg truncate max-w-[12rem] sm:max-w-none">{title}</span>
    </nav>
  )
}
