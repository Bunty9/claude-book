import React from 'react'
import Link from 'next/link'
import { chaptersForTrack } from '@/content/manifest'

const TRACK_BLURBS = [
  {
    id: 'beginner',
    label: 'Beginner',
    icon: '🌱',
    desc: 'New to AI? Start here. Understand what Claude is, how it thinks, and how to get the most out of it — no code required.',
  },
  {
    id: 'engineer',
    label: 'Engineer',
    icon: '⚙️',
    desc: 'Building with Claude? Learn the API, tool use, agentic loops, evaluation, and production patterns from first principles.',
  },
  {
    id: 'automator',
    label: 'Automator',
    icon: '⚡',
    desc: 'Automate your work with Claude — workflows, integrations, prompt chains, and operator-grade reliability without writing much code.',
  },
] as const

export default function LandingPage() {
  const firstChapter = chaptersForTrack('beginner')[0]

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 flex-1">
        <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-4">
          Interactive Book
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-fg leading-tight max-w-2xl">
          Claude,{' '}
          <span className="text-accent">End to End</span>
        </h1>
        <p className="mt-6 text-xl text-fg-muted max-w-lg leading-relaxed">
          Everything you need to understand, prompt, and build with Claude — from tokens to production agents.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/start"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-accent-fg font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Choose your path →
          </Link>
          {firstChapter !== undefined && (
            <Link
              href={`/c/${firstChapter.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-fg text-sm hover:border-accent hover:text-accent transition-colors"
            >
              Jump straight in
            </Link>
          )}
        </div>
      </section>

      {/* Track blurbs */}
      <section className="px-6 pb-24 max-w-4xl mx-auto w-full">
        <h2 className="text-center text-sm font-semibold text-fg-subtle uppercase tracking-widest mb-10">
          Three tracks, one book
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {TRACK_BLURBS.map(t => (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-bg-subtle p-6 flex flex-col gap-3"
            >
              <span className="text-3xl">{t.icon}</span>
              <h3 className="font-semibold text-fg">{t.label}</h3>
              <p className="text-sm text-fg-muted leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
