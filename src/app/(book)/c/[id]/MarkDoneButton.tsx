'use client'

import React, { useState, useEffect } from 'react'
import { markDone, unmarkDone, isDone } from '@/lib/progress'

interface MarkDoneButtonProps {
  id: string
}

export function MarkDoneButton({ id }: MarkDoneButtonProps) {
  // Start with false (matches SSR), then sync from localStorage after mount.
  const [done, setDone] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDone(isDone(id))
  }, [id])

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
