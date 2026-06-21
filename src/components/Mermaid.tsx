'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/app/providers'

interface MermaidProps {
  chart: string
}

export function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  const renderIdRef = useRef(0)
  const { theme } = useTheme()

  useEffect(() => {
    if (!containerRef.current) return

    const renderId = ++renderIdRef.current
    let cancelled = false
    setRendered(false)

    import('mermaid')
      .then((mod) => {
        const mermaid = mod.default
        const mermaidTheme = theme === 'light' ? 'default' : 'dark'
        mermaid.initialize({ startOnLoad: false, theme: mermaidTheme })
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
  }, [chart, theme])

  return (
    <div className="my-4 overflow-x-auto">
      <div ref={containerRef} className={rendered ? '' : 'hidden'} />
      {!rendered && (
        <pre className="text-sm text-fg-muted whitespace-pre-wrap">{chart}</pre>
      )}
    </div>
  )
}
