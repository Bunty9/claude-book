'use client'

import React from 'react'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-bg/80 backdrop-blur flex items-center">
      {/* ml-12 on mobile to clear the hamburger button (fixed at left-4) */}
      <div className="flex-1 ml-12 md:ml-0" />
      <div className="flex items-center pr-4">
        <ThemeToggle />
      </div>
    </header>
  )
}
