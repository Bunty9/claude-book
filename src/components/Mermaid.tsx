'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/app/providers'
import { labToRgb } from '@/lib/labColor'

interface MermaidProps {
  chart: string
}

/**
 * Resolve a CSS custom property to an sRGB color string Mermaid can parse.
 *
 * Tokens are authored in `oklch()`, and getComputedStyle normalizes them to
 * `lab(...)` in this engine — both of which Mermaid's color engine (khroma)
 * rejects, throwing at render time. We convert lab→rgb ourselves. rgb/hex
 * pass through; anything unrecognized returns raw (Mermaid then falls back).
 */
function resolveColor(varName: string): string {
  const probe = document.createElement('span')
  probe.style.color = `var(${varName})`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const raw = getComputedStyle(probe).color
  probe.remove()
  return labToRgb(raw) ?? raw
}

function readTokens(): Record<string, string> {
  const get = (v: string) => resolveColor(v)
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
    fontSize:           '18px',
  }
}

// ── Serialized renderer ──────────────────────────────────────────────────────
//
// `mermaid` is a global singleton: `initialize()` mutates shared config and
// `render()` manipulates a shared DOM sandbox, so concurrent calls from
// multiple <Mermaid> instances (e.g. several diagrams re-rendering together on
// a theme toggle) can interleave and corrupt each other's output. We load the
// library once, run every parse+render through a single promise queue, and
// re-initialize only when the theme tokens actually change.

type MermaidApi = (typeof import('mermaid'))['default']

let mermaidPromise: Promise<MermaidApi> | null = null
let lastTokenSig = ''
let renderQueue: Promise<unknown> = Promise.resolve()

function loadMermaid(): Promise<MermaidApi> {
  if (mermaidPromise === null) {
    mermaidPromise = import('mermaid').then((mod) => mod.default)
  }
  return mermaidPromise
}

/**
 * Render one chart to an SVG string. Returns null when the chart fails the
 * pre-flight parse (bad syntax); rejects when the import or render throws.
 * Calls are serialized so initialize/parse/render never interleave across
 * instances. Tokens are read inside the critical section so a render queued
 * during a theme toggle picks up the freshest colors.
 */
async function renderChart(
  chart: string,
  getTokens: () => Record<string, string>,
  id: string,
): Promise<string | null> {
  const run = renderQueue.then(async (): Promise<string | null> => {
    const mermaid = await loadMermaid()
    const tokens = getTokens()
    const sig = JSON.stringify(tokens)
    if (sig !== lastTokenSig) {
      mermaid.initialize({
        startOnLoad: false,
        suppressErrorRendering: true,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: tokens,
      })
      lastTokenSig = sig
    }
    const ok = await mermaid.parse(chart, { suppressErrors: true })
    if (!ok) return null
    const result = await mermaid.render(id, chart)
    return result.svg
  })
  // Keep the queue alive on settlement (errors swallowed here, surfaced to the
  // caller via `run`) so one failed render can't wedge the chain.
  renderQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
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

    const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`
    renderChart(chart, readTokens, id)
      .then((svg) => {
        if (cancelled || renderId !== renderIdRef.current) return
        if (svg === null) {
          setParseError(true) // pre-flight parse failed (bad syntax)
          return
        }
        const host = containerRef.current
        if (!host) return
        host.innerHTML = svg
        // Mermaid sizes the SVG to its intrinsic (often tiny) width and caps
        // it with an inline max-width, leaving diagrams hard to read. Let the
        // SVG scale up to fill the content column; the viewBox keeps the
        // aspect ratio so text enlarges proportionally.
        const el = host.querySelector('svg')
        if (el) {
          el.style.width = '100%'
          el.style.maxWidth = '100%'
          el.style.height = 'auto'
        }
        setRendered(true)
      })
      .catch((err: unknown) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[Mermaid] render failed:', err)
        }
        if (!cancelled && renderId === renderIdRef.current) {
          setParseError(true)
        }
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
    <div className="my-6 overflow-x-auto">
      <div ref={containerRef} className={rendered ? 'w-full' : 'hidden'} />
      {!rendered && !parseError && (
        <pre className="text-sm text-fg-muted whitespace-pre-wrap">{chart}</pre>
      )}
    </div>
  )
}
