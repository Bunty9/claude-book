'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/app/providers'

interface MermaidProps {
  chart: string
}

function readTokens(): Record<string, string> {
  const s = getComputedStyle(document.documentElement)
  const get = (v: string) => s.getPropertyValue(v).trim()
  return {
    primaryColor:       get('--bg-elevated'),
    primaryBorderColor: get('--border'),
    primaryTextColor:   get('--fg'),
    lineColor:          get('--fg-subtle'),
    secondaryColor:     get('--bg-subtle'),
    tertiaryColor:      get('--bg-subtle'),
    background:         get('--bg'),
    mainBkg:            get('--bg-elevated'),
    nodeBorder:         get('--border'),
    clusterBkg:         get('--bg-subtle'),
    textColor:          get('--fg'),
    actorBkg:           get('--bg-elevated'),
    actorBorder:        get('--border'),
    signalColor:        get('--fg-muted'),
    labelBoxBkgColor:   get('--bg-elevated'),
    fontFamily:         'ui-sans-serif, system-ui, sans-serif',
  }
}

export function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  const [parseError, setParseError] = useState(false)
  const renderIdRef = useRef(0)
  const { theme } = useTheme()

  useEffect(() => {
    if (!containerRef.current) return
    const renderId = ++renderIdRef.current
    let cancelled = false
    setRendered(false)
    setParseError(false)

    import('mermaid')
      .then(async (mod) => {
        const mermaid = mod.default
        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: readTokens(),
        })

        // Pre-flight parse — returns falsy on bad syntax
        const ok = await mermaid.parse(chart, { suppressErrors: true })
        if (!ok) {
          if (!cancelled && renderId === renderIdRef.current) setParseError(true)
          return
        }

        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`
        return mermaid.render(id, chart)
      })
      .then((result) => {
        if (result === undefined) return // parse failed path
        if (cancelled || renderId !== renderIdRef.current) return
        if (containerRef.current) {
          containerRef.current.innerHTML = result.svg
          setRendered(true)
        }
      })
      .catch(() => {
        // Render failed — fallback stays visible.
      })

    return () => {
      cancelled = true
    }
  }, [chart, theme])

  // Styled fallback for parse errors (readable, not a raw bomb)
  if (parseError) {
    return (
      <div className="my-6 overflow-x-auto rounded border border-border bg-bg-subtle px-4 py-3">
        <pre className="text-sm text-fg-muted font-mono whitespace-pre-wrap">{chart}</pre>
      </div>
    )
  }

  return (
    <div className="my-6 overflow-x-auto flex justify-center">
      <div ref={containerRef} className={rendered ? '' : 'hidden'} />
      {!rendered && !parseError && (
        <pre className="text-sm text-fg-muted whitespace-pre-wrap self-start">{chart}</pre>
      )}
    </div>
  )
}
