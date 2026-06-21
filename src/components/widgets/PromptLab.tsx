'use client'

import React, { useState, useId, useRef, useCallback } from 'react'
import { scorePrompt, CURATED_PAIRS, type PromptScore, type DimensionScore } from '@/lib/promptScore'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TOTAL =
  CURATED_PAIRS.length > 0
    ? Object.values(scorePrompt('').dimensions).reduce((s, d) => s + d.max, 0)
    : 100

const API_KEY_STORAGE = 'promptlab_anthropic_key'
const LS_PAIR_KEY = 'promptlab_selected_pair'

const DEFAULT_PROMPT =
  'You are a senior TypeScript engineer. Refactor the parseDate function in ' +
  'src/utils/date.ts to use async/await. Do not change the function signature. ' +
  'Return only the updated function. For example, replace callback(err, result) ' +
  'with try/catch and return result.'

// ─── Types ────────────────────────────────────────────────────────────────────

type LiveState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; text: string }
  | { status: 'error'; message: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function totalPct(score: PromptScore): number {
  return Math.round((score.total / MAX_TOTAL) * 100)
}

function gradeLabel(pct: number): string {
  if (pct >= 80) return 'Excellent'
  if (pct >= 60) return 'Good'
  if (pct >= 40) return 'Fair'
  if (pct >= 20) return 'Weak'
  return 'Poor'
}

function gradeColor(pct: number): string {
  if (pct >= 80) return 'text-tip'
  if (pct >= 60) return 'text-note'
  if (pct >= 40) return 'text-warning'
  return 'text-danger'
}

function dimBarColor(pct: number): string {
  if (pct >= 80) return 'bg-tip'
  if (pct >= 60) return 'bg-note'
  if (pct >= 40) return 'bg-warning'
  return 'bg-danger'
}

function readApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

function saveApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE, key.trim())
    } else {
      localStorage.removeItem(API_KEY_STORAGE)
    }
  } catch {
    // Storage unavailable — silently ignore
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface DimensionRowProps {
  dim: DimensionScore
}

function DimensionRow({ dim }: DimensionRowProps) {
  const pct = Math.round((dim.score / dim.max) * 100)
  const barColor = dimBarColor(pct)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-fg-muted uppercase tracking-wide">
          {dim.label}
        </span>
        <span className="text-xs tabular-nums text-fg-muted">
          {dim.score}/{dim.max}
        </span>
      </div>
      {/* Progress bar */}
      <div
        className="h-1.5 w-full rounded-full bg-bg-elevated overflow-hidden"
        role="progressbar"
        aria-label={`${dim.label} score`}
        aria-valuenow={dim.score}
        aria-valuemin={0}
        aria-valuemax={dim.max}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-fg-subtle leading-snug">{dim.feedback}</p>
    </div>
  )
}

interface ApiKeyPanelProps {
  apiKey: string
  onSave: (key: string) => void
}

function ApiKeyPanel({ apiKey, onSave }: ApiKeyPanelProps) {
  const [draft, setDraft] = useState(apiKey)
  const [visible, setVisible] = useState(false)
  const inputId = useId()

  const handleSave = useCallback(() => {
    onSave(draft)
  }, [draft, onSave])

  return (
    <details className="group">
      <summary className="cursor-pointer text-xs text-fg-muted hover:text-fg select-none list-none flex items-center gap-1">
        <span className="text-fg-subtle group-open:rotate-90 transition-transform inline-block">▶</span>
        <span>Optional: use your own API key for a live test call</span>
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        <p className="text-xs text-fg-subtle">
          Your key stays in <code>localStorage</code> on this device only — it is never sent anywhere except directly to{' '}
          <code>api.anthropic.com</code>.
        </p>
        <div className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Anthropic API key
          </label>
          <input
            id={inputId}
            type={visible ? 'text' : 'password'}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="sk-ant-…"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded border border-border bg-bg px-2 py-1 text-xs text-fg font-mono focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="rounded border border-border bg-bg px-2 py-1 text-xs text-fg-muted hover:text-fg focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label={visible ? 'Hide API key' : 'Show API key'}
          >
            {visible ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-accent px-3 py-1 text-xs font-semibold text-accent-fg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
          >
            Save
          </button>
        </div>
        {apiKey && (
          <p className="text-xs text-tip">Key saved locally. It will be used for live calls.</p>
        )}
      </div>
    </details>
  )
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function PromptLab() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [selectedPair, setSelectedPair] = useState<string | null>(null)
  const [showAfter, setShowAfter] = useState(false)
  const [apiKey, setApiKey] = useState(readApiKey)
  const [live, setLive] = useState<LiveState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  const textareaId = useId()
  const score = scorePrompt(prompt)
  const pct = totalPct(score)
  const grade = gradeLabel(pct)
  const gradeClass = gradeColor(pct)

  // ── Pair picker ────────────────────────────────────────────────────────────

  const activePair = CURATED_PAIRS.find(p => p.id === selectedPair) ?? null

  const handlePairSelect = useCallback((id: string) => {
    const pair = CURATED_PAIRS.find(p => p.id === id)
    if (pair === undefined) return
    setSelectedPair(id)
    setShowAfter(false)
    setPrompt(pair.before)
    setLive({ status: 'idle' })
    try { localStorage.setItem(LS_PAIR_KEY, id) } catch { /* ignore */ }
  }, [])

  const handleToggleAfter = useCallback(() => {
    if (activePair === null) return
    const next = !showAfter
    setShowAfter(next)
    setPrompt(next ? activePair.after : activePair.before)
    setLive({ status: 'idle' })
  }, [activePair, showAfter])

  const handleClearPair = useCallback(() => {
    setSelectedPair(null)
    setShowAfter(false)
    setPrompt('')
    setLive({ status: 'idle' })
    try { localStorage.removeItem(LS_PAIR_KEY) } catch { /* ignore */ }
  }, [])

  // ── API key ────────────────────────────────────────────────────────────────

  const handleSaveKey = useCallback((key: string) => {
    saveApiKey(key)
    setApiKey(key.trim())
  }, [])

  // ── Live call ──────────────────────────────────────────────────────────────

  const handleLiveCall = useCallback(async () => {
    if (!apiKey || !prompt.trim()) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLive({ status: 'loading' })

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => ({}))
        const message =
          typeof body === 'object' && body !== null && 'error' in body &&
          typeof body.error === 'object' && body.error !== null && 'message' in body.error &&
          typeof body.error.message === 'string'
            ? body.error.message
            : `API error ${response.status}`
        setLive({ status: 'error', message })
        return
      }

      const data: unknown = await response.json()
      const text =
        typeof data === 'object' && data !== null &&
        'content' in data && Array.isArray(data.content) &&
        data.content.length > 0 &&
        typeof data.content[0] === 'object' && data.content[0] !== null &&
        'text' in data.content[0] &&
        typeof data.content[0].text === 'string'
          ? data.content[0].text
          : '[No text in response]'

      setLive({ status: 'done', text })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Unknown error'
      setLive({ status: 'error', message })
    }
  }, [apiKey, prompt])

  const handleAbort = useCallback(() => {
    abortRef.current?.abort()
    setLive({ status: 'idle' })
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="my-6 rounded-lg border border-border bg-bg-subtle not-prose" role="region" aria-label="Prompt Lab">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-fg">Prompt Lab</span>
        <span className="text-xs text-fg-muted italic">Rule-based scorer + live test</span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* ── Curated pair picker ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide">
            Load a curated before/after pair
          </p>
          <div className="flex flex-wrap gap-2">
            {CURATED_PAIRS.map(pair => (
              <button
                key={pair.id}
                type="button"
                onClick={() => handlePairSelect(pair.id)}
                aria-pressed={selectedPair === pair.id}
                className={
                  'rounded border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-accent ' +
                  (selectedPair === pair.id
                    ? 'border-accent bg-accent-subtle text-accent'
                    : 'border-border bg-bg text-fg-muted hover:text-fg hover:border-fg-muted')
                }
              >
                {pair.label}
              </button>
            ))}
            {selectedPair !== null && (
              <button
                type="button"
                onClick={handleClearPair}
                className="rounded border border-border bg-bg px-2.5 py-1 text-xs text-fg-muted hover:text-danger hover:border-danger transition-colors focus:outline-none focus:ring-1 focus:ring-danger"
                aria-label="Clear selected pair"
              >
                Clear
              </button>
            )}
          </div>

          {activePair !== null && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleAfter}
                role="switch"
                aria-checked={showAfter}
                className={
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 ' +
                  (showAfter ? 'bg-accent' : 'bg-bg-elevated')
                }
              >
                <span
                  className={
                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-fg shadow transform transition-transform duration-200 ' +
                    (showAfter ? 'translate-x-4' : 'translate-x-0')
                  }
                />
              </button>
              <span className="text-xs text-fg-muted">
                {showAfter ? 'Showing improved prompt' : 'Showing weak prompt'} — toggle to compare
              </span>
            </div>
          )}
        </div>

        {/* ── Textarea ── */}
        <div className="flex flex-col gap-1">
          <label htmlFor={textareaId} className="text-xs font-semibold text-fg-muted uppercase tracking-wide">
            Your prompt
          </label>
          <textarea
            id={textareaId}
            value={prompt}
            onChange={e => { setPrompt(e.target.value); setLive({ status: 'idle' }) }}
            rows={6}
            placeholder="Type or paste a prompt to score it…"
            className="w-full rounded border border-border bg-bg p-3 text-sm text-fg font-mono resize-y focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="text-xs text-fg-subtle text-right tabular-nums">
            {prompt.trim().split(/\s+/).filter(w => w.length > 0).length} words
          </p>
        </div>

        {/* ── Score summary ── */}
        <div className="rounded border border-border bg-bg p-3 flex items-center gap-4">
          {/* Big pct */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <span className={`text-3xl font-bold tabular-nums ${gradeClass}`}>{pct}</span>
            <span className="text-xs text-fg-subtle">/ 100</span>
          </div>
          {/* Overall bar */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${gradeClass}`}>{grade}</span>
              <span className="text-xs text-fg-muted">{score.total} / {MAX_TOTAL} pts</span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-bg-elevated overflow-hidden"
              role="progressbar"
              aria-label="Overall prompt score"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${dimBarColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Dimension breakdown ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(Object.values(score.dimensions) as DimensionScore[]).map(dim => (
            <DimensionRow key={dim.label} dim={dim} />
          ))}
        </div>

        {/* ── API key + live call ── */}
        <div className="rounded border border-border bg-bg p-3 flex flex-col gap-3">
          <ApiKeyPanel apiKey={apiKey} onSave={handleSaveKey} />

          {apiKey && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLiveCall}
                  disabled={live.status === 'loading' || !prompt.trim()}
                  className="rounded bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-opacity"
                >
                  {live.status === 'loading' ? 'Calling…' : 'Test live (Haiku)'}
                </button>
                {live.status === 'loading' && (
                  <button
                    type="button"
                    onClick={handleAbort}
                    className="text-xs text-danger hover:underline focus:outline-none"
                  >
                    Cancel
                  </button>
                )}
                <span className="text-xs text-fg-subtle">
                  Uses <code>claude-haiku-4-5</code>, max 300 tokens
                </span>
              </div>

              {live.status === 'done' && (
                <div className="rounded border border-border bg-bg-subtle p-3">
                  <p className="mb-1 text-xs font-semibold text-fg-muted uppercase tracking-wide">
                    Response
                  </p>
                  <p className="text-xs text-fg whitespace-pre-wrap leading-relaxed">{live.text}</p>
                </div>
              )}

              {live.status === 'error' && (
                <div className="rounded border border-danger bg-danger-subtle p-3">
                  <p className="text-xs text-danger">{live.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
