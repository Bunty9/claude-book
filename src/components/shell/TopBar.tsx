'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { chapterById } from '@/content/manifest'
import { Breadcrumbs } from '@/components/shell/Breadcrumbs'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

// Pull the chapter id out of `/c/<id>` or `/c/<id>/` (trailingSlash: true).
function chapterIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/c\/([^/]+)\/?$/)
  return match === null ? undefined : match[1]
}

export function TopBar() {
  const pathname = usePathname()
  const id = chapterIdFromPath(pathname)
  const meta = id === undefined ? undefined : chapterById(id)

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-bg/80 backdrop-blur flex items-center">
      {/* ml-12 on mobile clears the hamburger button (fixed at left-4) */}
      <div className="flex-1 min-w-0 ml-12 md:ml-6 flex flex-col justify-center gap-0.5 overflow-hidden">
        {meta !== undefined && (
          <>
            <Breadcrumbs part={meta.part} title={meta.title} compact />
            <h1 className="text-sm font-semibold text-fg leading-tight truncate">
              {meta.title}
            </h1>
          </>
        )}
      </div>
      <div className="flex items-center pr-4 pl-3 shrink-0">
        <ThemeToggle />
      </div>
    </header>
  )
}
