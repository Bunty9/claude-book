'use client'

import React, { useState } from 'react'
import { markDone, unmarkDone, isDone } from '@/lib/progress'

interface MarkDoneButtonProps {
  id: string
}

export function MarkDoneButton({ id }: MarkDoneButtonProps) {
  // Lazy initializer: reads localStorage once on mount (client only).
  // isDone already guards typeof window === 'undefined' and returns false SSR.
  const [done, setDone] = useState(() => isDone(id))

  function toggle() {
    if (done) {
      unmarkDone(id)
      setDone(false)
    } else {
      markDone(id)
      setDone(true)
    }
  }

  return (
    <button
      onClick={toggle}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
        done
          ? 'bg-accent text-accent-fg'
          : 'border border-border text-fg-muted hover:text-fg hover:border-accent',
      ].join(' ')}
    >
      {done ? '✓ Done' : 'Mark as done'}
    </button>
  )
}
