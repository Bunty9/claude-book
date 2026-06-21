import { Sidebar } from '@/components/shell/Sidebar'
import { TableOfContents } from '@/components/shell/TableOfContents'

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 px-6 py-8 max-w-prose mx-auto">
        {children}
      </main>
      <aside className="hidden xl:block w-56 shrink-0 px-4 py-8">
        <TableOfContents />
      </aside>
    </div>
  )
}
