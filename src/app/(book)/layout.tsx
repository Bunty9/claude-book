'use client'

import React from 'react'
import { Sidebar } from '@/components/shell/Sidebar'
import { TableOfContents } from '@/components/shell/TableOfContents'
import { SearchPalette, useSearchPalette } from '@/components/shell/SearchPalette'

function BookLayoutInner({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSearchPalette()

  return (
    <div className="flex min-h-screen">
      <Sidebar onOpenSearch={() => setOpen(true)} />
      <main className="flex-1 min-w-0 px-6 py-8 max-w-prose mx-auto">
        {children}
      </main>
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
