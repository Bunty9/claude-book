'use client'

import React, { useEffect, useRef, useState } from 'react'

interface MarkmapProps {
  markdown: string
}

export function Markmap({ markdown }: MarkmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [rendered, setRendered] = useState(false)
  const instanceRef = useRef<import('markmap-view').Markmap | null>(null)

  useEffect(() => {
    if (!svgRef.current) return

    let cancelled = false

    Promise.all([import('markmap-lib'), import('markmap-view')])
      .then(([{ Transformer }, { Markmap }]) => {
        if (cancelled) return

        const transformer = new Transformer()
        const { root } = transformer.transform(markdown)

        if (instanceRef.current) {
          // Update existing instance rather than creating a new one
          instanceRef.current.setData(root)
          instanceRef.current.fit()
        } else if (svgRef.current) {
          instanceRef.current = Markmap.create(svgRef.current, undefined, root)
        }
        setRendered(true)
      })
      .catch(() => {
        // Render failed — fallback text stays visible.
      })

    return () => {
      cancelled = true
    }
  }, [markdown])

  return (
    <div className="my-4 overflow-x-auto">
      <svg
        ref={svgRef}
        className={`w-full min-h-[300px] ${rendered ? '' : 'hidden'}`}
      />
      {!rendered && (
        <pre className="text-sm text-fg-muted whitespace-pre-wrap">{markdown}</pre>
      )}
    </div>
  )
}
