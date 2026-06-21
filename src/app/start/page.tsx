import React from 'react'
import Link from 'next/link'
import { PathPicker } from '@/components/PathPicker'

export default function StartPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-xs text-fg-muted hover:text-fg transition-colors">
            ← Back to home
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg">
            Choose your path
          </h1>
          <p className="mt-2 text-fg-muted">
            Answer two quick questions and we&apos;ll recommend the right track.
          </p>
        </div>

        <PathPicker />
      </div>
    </main>
  )
}
