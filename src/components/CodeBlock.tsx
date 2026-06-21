'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { BundledLanguage, SpecialLanguage } from 'shiki'

interface CodeBlockProps {
  children: string
  className?: string
}

// Singleton highlighter promise — created once, reused across all CodeBlocks.
let highlighterPromise: Promise<import('shiki').Highlighter> | null = null

function getHighlighter(): Promise<import('shiki').Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['github-dark', 'github-light'],
        langs: [
          'typescript',
          'javascript',
          'tsx',
          'jsx',
          'json',
          'bash',
          'sh',
          'python',
          'css',
          'html',
          'markdown',
          'mdx',
          'yaml',
          'toml',
          'text',
        ],
      })
    )
  }
  return highlighterPromise
}

/** Narrows a raw string to BundledLanguage by checking against what the highlighter loaded. */
function isBundledLanguage(l: string, loaded: readonly string[]): l is BundledLanguage {
  return loaded.includes(l)
}

/** The safe fallback when a language is not loaded. */
const FALLBACK_LANG: SpecialLanguage = 'text'

function extractLanguage(className?: string): string {
  if (!className) return 'text'
  const match = /language-(\w+)/.exec(className)
  return match ? match[1] : 'text'
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const lang = extractLanguage(className)
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    getHighlighter()
      .then((hl) => {
        // Check if the lang is loaded; fall back to 'text' if not.
        const loadedLangs = hl.getLoadedLanguages()
        const safeLang: BundledLanguage | SpecialLanguage = isBundledLanguage(lang, loadedLangs) ? lang : FALLBACK_LANG
        const highlighted = hl.codeToHtml(children, {
          lang: safeLang,
          themes: { dark: 'github-dark', light: 'github-light' },
          defaultColor: false,
        })
        if (!cancelled) setHtml(highlighted)
      })
      .catch(() => {
        // Highlight failed — stay on plain fallback.
      })

    return () => {
      cancelled = true
    }
  }, [children, lang])

  function handleCopy() {
    void navigator.clipboard.writeText(children).then(() => {
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="relative group rounded border bg-code-bg border-code-border overflow-hidden my-4">
      <button
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute top-2 right-2 z-10 px-2 py-1 text-xs rounded border border-border bg-bg-elevated text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>

      {html ? (
        // Shiki wraps in <pre><code>; we dangerouslySetInnerHTML the container div
        // and let its own styling apply. The token-backed container provides bg/border.
        <div
          className="overflow-x-auto [&>pre]:!bg-transparent [&>pre]:!border-0 [&>pre]:!rounded-none [&>pre]:p-4 [&>pre]:m-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="!bg-transparent !border-0 !rounded-none p-4 m-0 overflow-x-auto">
          <code>{children}</code>
        </pre>
      )}
    </div>
  )
}
