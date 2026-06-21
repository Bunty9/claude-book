'use client'

import React from 'react'
import { useTrack } from '@/app/providers'
import { completion, useProgressVersion } from '@/lib/progress'
import { useMounted } from '@/lib/useMounted'

export function ProgressBadge() {
  const { track } = useTrack()
  const mounted = useMounted()
  useProgressVersion()
  const { pct, done, total } = mounted ? completion(track) : { done: 0, total: 0, pct: 0 }
  return (
    <span className="text-xs text-fg-subtle">
      {done}/{total} · {pct}%
    </span>
  )
}
