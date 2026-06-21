'use client'

import React from 'react'
import { Sidebar } from '@/components/shell/Sidebar'
import { TableOfContents } from '@/components/shell/TableOfContents'
import { SearchPalette, useSearchPalette } from '@/components/shell/SearchPalette'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

function BookLayoutInner({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSearchPalette()

  return (
    <div className="flex min-h-screen">
      <Sidebar onOpenSearch={() => setOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-end px-4 pt-4">
          <ThemeToggle />
        </div>
        <main className="flex-1 px-6 py-4 max-w-prose mx-auto w-full">
          {children}
        </main>
      </div>
      <aside className="hidden xl:block w-56 shrink-0 px-4 py-8">
        <TableOfContents />
      </aside>
      <SearchPalette open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <BookLayoutInner>{children}</BookLayoutInner>
}
