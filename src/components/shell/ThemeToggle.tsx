'use client'

import React from 'react'
import { useTheme } from '@/app/providers'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="p-2 rounded text-fg-muted hover:text-fg hover:bg-bg-elevated transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  )
}
