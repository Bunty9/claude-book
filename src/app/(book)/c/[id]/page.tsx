import React from 'react'
import { notFound } from 'next/navigation'
import { chapters, chapterById } from '@/content/manifest'
import { Breadcrumbs } from '@/components/shell/Breadcrumbs'
import { PrevNext } from '@/components/shell/PrevNext'
import { MarkDoneButton } from './MarkDoneButton'

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export function generateStaticParams(): { id: string }[] {
  return chapters.map(c => ({ id: c.id }))
}

export const dynamicParams = false

// ---------------------------------------------------------------------------
// Explicit map of chapter id → lazy MDX module factory.
// Add an entry here when a new chapter MDX file is authored.
// Keeping this explicit (not a template-literal import) lets Next's static
// export bundler analyse all branches at build time.
// ---------------------------------------------------------------------------

const CHAPTERS_MDX: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  'what-is-an-llm': () => import('@/content/p0/what-is-an-llm.mdx'),
}

// ---------------------------------------------------------------------------
// Coming-soon placeholder
// ---------------------------------------------------------------------------

function ComingSoon() {
  return (
    <div className="rounded-lg border border-border bg-bg-subtle p-8 text-center">
      <p className="text-2xl mb-2">📖</p>
      <h2 className="text-lg font-semibold text-fg mb-1">Chapter coming soon</h2>
      <p className="text-fg-muted text-sm">
        This chapter is in the manifest but hasn&apos;t been written yet.
        Check back soon.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Load the MDX component for an id — returns null if missing or on error.
// Keep data-fetching separate from JSX to satisfy react-hooks/error-boundaries.
// ---------------------------------------------------------------------------

async function loadMdxComponent(id: string): Promise<React.ComponentType | null> {
  const factory = CHAPTERS_MDX[id]
  if (factory === undefined) return null
  try {
    const mod = await factory()
    return mod.default
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// MDX renderer: receives the already-loaded component (or null → coming soon)
// ---------------------------------------------------------------------------

function MdxContent({ Content }: { Content: React.ComponentType | null }) {
  if (Content === null) return <ComingSoon />
  return (
    <div className="prose prose-invert max-w-none">
      <Content />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface ChapterPageProps {
  params: Promise<{ id: string }>
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { id } = await params
  const meta = chapterById(id)

  if (meta === undefined) {
    return notFound()
  }

  const Content = await loadMdxComponent(id)

  return (
    <article>
      <Breadcrumbs part={meta.part} title={meta.title} />

      <header className="mb-8">
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide mb-1">
          Part {meta.part} · {meta.estMinutes} min read
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-fg">{meta.title}</h1>
        <p className="mt-2 text-lg text-fg-muted">{meta.summary}</p>
      </header>

      <MdxContent Content={Content} />

      <div className="mt-8 flex justify-end">
        <MarkDoneButton id={id} />
      </div>

      <PrevNext id={id} />
    </article>
  )
}
