'use client'

import React, { useEffect, useRef, useState } from 'react'

interface MermaidProps {
  chart: string
}

let mermaidInitialized = false

export function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  const renderIdRef = useRef(0)

  useEffect(() => {
    if (!containerRef.current) return

    const renderId = ++renderIdRef.current
    let cancelled = false

    import('mermaid')
      .then((mod) => {
        const mermaid = mod.default
        if (!mermaidInitialized) {
          mermaid.initialize({ startOnLoad: false, theme: 'dark' })
          mermaidInitialized = true
        }
        // Unique id required by mermaid's render API
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`
        return mermaid.render(id, chart)
      })
      .then(({ svg }) => {
        if (cancelled || renderId !== renderIdRef.current) return
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          setRendered(true)
        }
      })
      .catch(() => {
        // Render failed — fallback <pre> stays visible.
      })

    return () => {
      cancelled = true
    }
  }, [chart])

  return (
    <div className="my-4 overflow-x-auto">
      {/* Always mount the container div; it receives the SVG innerHTML */}
      <div ref={containerRef} className={rendered ? '' : 'hidden'} />
      {!rendered && (
        <pre className="text-sm text-fg-muted whitespace-pre-wrap">{chart}</pre>
      )}
    </div>
  )
}
