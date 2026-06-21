'use client'

import React, { useState } from 'react'
import { estimateTokens } from '@/lib/tokenizer'
import { MODELS, costBoth } from '@/lib/cost'

const DEFAULT_TEXT =
  'The quick brown fox jumps over the lazy dog. ' +
  'Paste your own text here to see how many tokens it uses ' +
  'and what it would cost to send it to each Claude model.'

/** Formats a USD amount to a readable string. */
function formatUsd(amount: number): string {
  if (amount < 0.000001) return '$0.000000'
  if (amount < 0.001) return `$${amount.toFixed(6)}`
  if (amount < 0.01) return `$${amount.toFixed(4)}`
  return `$${amount.toFixed(4)}`
}

export function Tokenizer() {
  const [text, setText] = useState(DEFAULT_TEXT)

  const tokens = estimateTokens(text)

  return (
    <div className="my-6 rounded-lg border border-border bg-bg-subtle p-4 not-prose">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-fg">Token &amp; Cost Estimator</span>
        <span className="text-xs text-fg-muted italic">
          Approximate — token counts are heuristic
        </span>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        className="w-full rounded border border-border bg-bg p-3 text-sm text-fg font-mono resize-y focus:outline-none focus:ring-1 focus:ring-accent"
        placeholder="Paste or type text here…"
        aria-label="Text to tokenize"
      />

      <div className="mt-3 flex items-center gap-3">
        <span className="text-lg font-bold text-accent tabular-nums">{tokens.toLocaleString()}</span>
        <span className="text-sm text-fg-muted">estimated tokens</span>
        <span className="text-xs text-fg-subtle">
          ({text.length.toLocaleString()} chars)
        </span>
      </div>

      {tokens > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-xs text-fg-muted uppercase tracking-wide">
                <th className="pb-2 text-left font-medium">Model</th>
                <th className="pb-2 text-right font-medium">Input cost</th>
                <th className="pb-2 text-right font-medium">Round-trip est.</th>
                <th className="pb-2 text-right font-medium">Input ¢/1K tok</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map(model => {
                // Assume output ≈ input tokens for a simple round-trip estimate
                const { input, total } = costBoth(tokens, tokens, model)
                const centsPerThousand = (model.inputPerM / 1000) * 100
                return (
                  <tr
                    key={model.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2 pr-4 font-medium text-fg">{model.label}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-fg-muted">
                      {formatUsd(input)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-fg-muted">
                      {formatUsd(total)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-fg-subtle text-xs">
                      {centsPerThousand.toFixed(3)}¢
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-fg-subtle italic">
            Indicative list prices. Assumes equal input and output tokens for round-trip.
            Actual costs depend on exact token counts and current Anthropic pricing.
          </p>
        </div>
      )}
    </div>
  )
}
