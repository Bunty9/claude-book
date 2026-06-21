'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTrack } from '@/app/providers'
import { chaptersForTrack } from '@/content/manifest'
import { recommendTrack, PathAnswers } from '@/lib/recommendTrack'
import { TrackId } from '@/content/types'

// ---------------------------------------------------------------------------
// Quiz option config
// ---------------------------------------------------------------------------

const CODING_OPTIONS: { value: PathAnswers['codes']; label: string; desc: string }[] = [
  { value: 'none', label: 'None / minimal', desc: "I don't write code" },
  { value: 'some', label: 'Some', desc: 'Comfortable with scripts or no-code tools' },
  { value: 'pro', label: 'Professional', desc: 'I build software regularly' },
]

const GOAL_OPTIONS: { value: PathAnswers['goal']; label: string; desc: string }[] = [
  { value: 'basics', label: 'Learn the basics', desc: 'Understand how Claude works' },
  { value: 'build', label: 'Build software', desc: 'Integrate Claude into apps and services' },
  { value: 'automate', label: 'Automate my work', desc: 'Supercharge workflows without heavy coding' },
]

const TRACK_LABELS: Record<TrackId, { label: string; icon: string; desc: string }> = {
  beginner: { label: 'Beginner', icon: '🌱', desc: 'Clear explanations, no code required.' },
  engineer: { label: 'Engineer', icon: '⚙️', desc: 'API, tool use, agents, production.' },
  automator: { label: 'Automator', icon: '⚡', desc: 'Workflows, integrations, prompt chains.' },
}

const ALL_TRACKS: TrackId[] = ['beginner', 'engineer', 'automator']

// ---------------------------------------------------------------------------
// Option button
// ---------------------------------------------------------------------------

interface OptionButtonProps<T extends string> {
  option: { value: T; label: string; desc: string }
  selected: boolean
  onSelect: (v: T) => void
}

function OptionButton<T extends string>({ option, selected, onSelect }: OptionButtonProps<T>) {
  return (
    <button
      onClick={() => onSelect(option.value)}
      className={[
        'w-full text-left px-4 py-3 rounded-lg border transition-colors',
        selected
          ? 'border-accent bg-accent-subtle text-accent'
          : 'border-border text-fg hover:border-fg-muted',
      ].join(' ')}
    >
      <p className="font-medium text-sm">{option.label}</p>
      <p className="text-xs text-fg-muted mt-0.5">{option.desc}</p>
    </button>
  )
}

// ---------------------------------------------------------------------------
// PathPicker wizard
// ---------------------------------------------------------------------------

export function PathPicker() {
  const router = useRouter()
  const { setTrack } = useTrack()
  const [codes, setCodes] = useState<PathAnswers['codes'] | null>(null)
  const [goal, setGoal] = useState<PathAnswers['goal'] | null>(null)
  const [step, setStep] = useState<'q1' | 'q2' | 'result'>('q1')

  function handleCodes(v: PathAnswers['codes']) {
    setCodes(v)
    setStep('q2')
  }

  function handleGoal(v: PathAnswers['goal']) {
    setGoal(v)
    setStep('result')
  }

  function startTrack(t: TrackId) {
    setTrack(t)
    const chapters = chaptersForTrack(t)
    const first = chapters[0]
    if (first !== undefined) {
      router.push(`/c/${first.id}`)
    } else {
      router.push('/')
    }
  }

  if (step === 'q1') {
    return (
      <div className="space-y-4">
        <h2 className="font-semibold text-fg">What&apos;s your coding experience?</h2>
        <div className="space-y-2">
          {CODING_OPTIONS.map(o => (
            <OptionButton key={o.value} option={o} selected={false} onSelect={handleCodes} />
          ))}
        </div>
      </div>
    )
  }

  if (step === 'q2') {
    return (
      <div className="space-y-4">
        <h2 className="font-semibold text-fg">What do you want to do with Claude?</h2>
        <div className="space-y-2">
          {GOAL_OPTIONS.map(o => (
            <OptionButton key={o.value} option={o} selected={false} onSelect={handleGoal} />
          ))}
        </div>
        <button
          onClick={() => setStep('q1')}
          className="text-xs text-fg-muted hover:text-fg transition-colors"
        >
          ← Back
        </button>
      </div>
    )
  }

  // Result step
  if (codes === null || goal === null) return null

  const recommended = recommendTrack({ codes, goal })
  const info = TRACK_LABELS[recommended]

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-accent bg-accent-subtle p-6 text-center">
        <p className="text-3xl mb-2">{info.icon}</p>
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-widest mb-1">
          Recommended for you
        </p>
        <h2 className="text-xl font-bold text-fg">{info.label} track</h2>
        <p className="text-sm text-fg-muted mt-1">{info.desc}</p>
        <button
          onClick={() => startTrack(recommended)}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-accent-fg font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Start {info.label} track →
        </button>
      </div>

      <div>
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wide mb-3">
          Or choose manually
        </p>
        <div className="grid grid-cols-3 gap-3">
          {ALL_TRACKS.map(t => {
            const ti = TRACK_LABELS[t]
            return (
              <button
                key={t}
                onClick={() => startTrack(t)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border text-sm hover:border-accent hover:text-accent transition-colors"
              >
                <span className="text-xl">{ti.icon}</span>
                <span className="font-medium text-fg text-xs">{ti.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => { setCodes(null); setGoal(null); setStep('q1') }}
        className="text-xs text-fg-muted hover:text-fg transition-colors"
      >
        ← Retake quiz
      </button>
    </div>
  )
}
