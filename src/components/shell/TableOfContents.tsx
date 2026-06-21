'use client'

import React, { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

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
  const pathname = usePathname()
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Re-query headings whenever the pathname changes (new chapter)
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setHeadings(queryHeadings())
      setActiveId('')
    })
    return () => cancelAnimationFrame(rafId)
  }, [pathname])

  // Set up IntersectionObserver for scroll-spy
  useEffect(() => {
    if (headings.length === 0) return

    observerRef.current?.disconnect()

    const observer = new IntersectionObserver(
      entries => {
        // Find the last entry that is intersecting (topmost in viewport)
        let found: string | null = null
        for (const entry of entries) {
          if (entry.isIntersecting) {
            found = entry.target.id
          }
        }
        if (found !== null) {
          setActiveId(found)
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0 },
    )

    headings.forEach(h => {
      const el = document.getElementById(h.id)
      if (el !== null) observer.observe(el)
    })

    observerRef.current = observer
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav aria-label="Table of contents">
      <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide mb-3">On this page</p>
      <ul className="space-y-1">
        {headings.map(h => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={e => handleClick(e, h.id)}
              className={[
                'block text-sm transition-colors',
                h.id === activeId
                  ? 'text-accent font-medium border-l-2 border-accent pl-2'
                  : `text-fg-muted hover:text-fg ${h.level === 3 ? 'pl-3' : 'pl-0'}`,
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
