'use client'

import React, { useEffect, useState } from 'react'

interface Heading {
  id: string
  text: string
  level: 2 | 3
}

function queryHeadings(): Heading[] {
  const article = document.querySelector('main article') ?? document.querySelector('main')
  if (article === null) return []
  const nodes = article.querySelectorAll('h2, h3')
  const found: Heading[] = []
  nodes.forEach(node => {
    const tagName = node.tagName.toLowerCase()
    const level = tagName === 'h2' ? 2 : 3
    const id = node.id
    const text = node.textContent ?? ''
    if (id) found.push({ id, text, level })
  })
  return found
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])

  useEffect(() => {
    // Queue the DOM query so it runs after paint and satisfies the
    // react-hooks/set-state-in-effect rule (setState in a callback, not inline).
    const id = requestAnimationFrame(() => {
      setHeadings(queryHeadings())
    })
    return () => cancelAnimationFrame(id)
  }, [])

  if (headings.length === 0) return null

  return (
    <nav aria-label="Table of contents">
      <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide mb-3">On this page</p>
      <ul className="space-y-1">
        {headings.map(h => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={[
                'block text-sm text-fg-muted hover:text-fg transition-colors',
                h.level === 3 ? 'pl-3' : '',
              ].join(' ')}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
