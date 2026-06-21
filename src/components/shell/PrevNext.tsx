'use client'

import React from 'react'
import Link from 'next/link'
import { useTrack } from '@/app/providers'
import { prevNextFor } from '@/lib/prevNext'

interface PrevNextProps {
  id: string
}

export function PrevNext({ id }: PrevNextProps) {
  const { track } = useTrack()
  const { prev, next } = prevNextFor(id, track)

  if (prev === undefined && next === undefined) return null

  return (
    <nav className="flex justify-between mt-12 pt-6 border-t border-border">
      {prev !== undefined ? (
        <Link
          href={`/c/${prev.id}`}
          className="flex flex-col items-start gap-1 text-sm group"
        >
          <span className="text-fg-subtle text-xs">← Previous</span>
          <span className="text-fg group-hover:text-accent transition-colors">{prev.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {next !== undefined ? (
        <Link
          href={`/c/${next.id}`}
          className="flex flex-col items-end gap-1 text-sm group"
        >
          <span className="text-fg-subtle text-xs">Next →</span>
          <span className="text-fg group-hover:text-accent transition-colors">{next.title}</span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
