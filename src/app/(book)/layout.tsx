'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/shell/Sidebar'
import { TableOfContents } from '@/components/shell/TableOfContents'
import { SearchPalette, useSearchPalette } from '@/components/shell/SearchPalette'
import { TopBar } from '@/components/shell/TopBar'

function BookLayoutInner({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSearchPalette()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      <div className="max-w-[100rem] mx-auto w-full flex min-h-screen">
        {/* Left: Sidebar — handles its own sticky (desktop) / overlay (mobile) */}
        <Sidebar onOpenSearch={() => setOpen(true)} />

        {/* Center column */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 w-full max-w-3xl mx-auto px-6 lg:px-8 py-8">
            <div className="animate-fade-in" key={pathname}>
              {children}
            </div>
          </main>
        </div>

        {/* Right: TOC — sticky, shown at lg+ */}
        <aside className="hidden lg:block w-[16rem] shrink-0 sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto py-8 px-4">
          <TableOfContents />
        </aside>
      </div>
      <SearchPalette open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <BookLayoutInner>{children}</BookLayoutInner>
}
