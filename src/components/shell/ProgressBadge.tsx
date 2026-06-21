'use client'

import React from 'react'
import { useTrack } from '@/app/providers'
import { completion } from '@/lib/progress'

export function ProgressBadge() {
  const { track } = useTrack()
  const { pct, done, total } = completion(track)
  return (
    <span className="text-xs text-fg-subtle">
      {done}/{total} · {pct}%
    </span>
  )
}
