'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/app/providers'

interface MermaidProps {
  chart: string
}

/** Gamma-encode one linear-sRGB channel and quantize to 0-255. */
function encodeChannel(linear: number): number {
  const c = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
}

/**
 * Convert a CSS `lab(L a b)` string (D50 white point, per CSS Color 4) to
 * an sRGB `rgb(...)` string. Returns null if the input is not a lab() value.
 */
function labToRgb(value: string): string | null {
  const match = value.match(/^lab\(\s*([\d.+-]+)%?\s+([\d.+-]+)\s+([\d.+-]+)/)
  if (!match) return null
  const L = Number(match[1])
  const a = Number(match[2])
  const b = Number(match[3])
  if (!Number.isFinite(L) || !Number.isFinite(a) || !Number.isFinite(b)) return null

  // CIELAB → XYZ (D50)
  const fy = (L + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  const epsilon = 216 / 24389
  const kappa = 24389 / 27
  const fx3 = fx ** 3
  const fz3 = fz ** 3
  const xr = fx3 > epsilon ? fx3 : (116 * fx - 16) / kappa
  const yr = L > kappa * epsilon ? fy ** 3 : L / kappa
  const zr = fz3 > epsilon ? fz3 : (116 * fz - 16) / kappa
  const X = xr * 0.96422
  const Y = yr * 1.0
  const Z = zr * 0.82521

  // XYZ (D50) → linear sRGB (Bradford-adapted matrix, CSS Color 4)
  const r = 3.1341359 * X - 1.6173086 * Y - 0.4906238 * Z
  const g = -0.9787553 * X + 1.9161606 * Y + 0.033454 * Z
  const bl = 0.0719453 * X - 0.2289914 * Y + 1.4052427 * Z
  return `rgb(${encodeChannel(r)}, ${encodeChannel(g)}, ${encodeChannel(bl)})`
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
          // Mermaid sizes the SVG to its intrinsic (often tiny) width and caps
          // it with an inline max-width, leaving diagrams hard to read. Let the
          // SVG scale up to fill the content column; the viewBox keeps the
          // aspect ratio so text enlarges proportionally.
          const svg = containerRef.current.querySelector('svg')
          if (svg) {
            svg.style.width = '100%'
            svg.style.maxWidth = '100%'
            svg.style.height = 'auto'
          }
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
    <div className="my-6 overflow-x-auto">
      <div ref={containerRef} className={rendered ? 'w-full' : 'hidden'} />
      {!rendered && !parseError && (
        <pre className="text-sm text-fg-muted whitespace-pre-wrap">{chart}</pre>
      )}
    </div>
  )
}
