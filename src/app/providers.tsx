'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { TrackId } from '@/content/types'
import { getTrack, setTrack as persistTrack } from '@/lib/track'

// ── Track context ──────────────────────────────────────────────────────────

interface TrackContextValue {
  track: TrackId
  setTrack: (t: TrackId) => void
}

const TrackContext = createContext<TrackContextValue | null>(null)

export function useTrack(): TrackContextValue {
  const ctx = useContext(TrackContext)
  if (ctx === null) throw new Error('useTrack must be used within <Providers>')
  return ctx
}

// ── Theme context ──────────────────────────────────────────────────────────

type Theme = 'dark' | 'light'
const THEME_KEY = 'cb:theme'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (ctx === null) throw new Error('useTheme must be used within <Providers>')
  return ctx
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

// ── Providers ──────────────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  // Lazy initialisers run only on the client after hydration, so localStorage
  // is available and we avoid setState-in-effect entirely.
  const [track, setTrackState] = useState<TrackId>(() => getTrack())
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme())

  // Apply theme class to document
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [theme])

  function setTrack(t: TrackId) {
    persistTrack(t)
    setTrackState(t)
  }

  function toggle() {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_KEY, next)
      }
      return next
    })
  }

  return (
    <TrackContext.Provider value={{ track, setTrack }}>
      <ThemeContext.Provider value={{ theme, toggle }}>
        {children}
      </ThemeContext.Provider>
    </TrackContext.Provider>
  )
}
