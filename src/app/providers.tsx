'use client'

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
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
const THEME_EVENT = 'cb:theme'
const TRACK_EVENT = 'cb:track'

const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

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

// External-store plumbing. useSyncExternalStore reads the SSR snapshot on the
// server and the first hydration render, then switches to the live snapshot —
// so the markup matches the server (no hydration mismatch) and there is no
// setState-in-effect. Writers dispatch a window event to notify subscribers.

function makeSubscribe(event: string) {
  return (onChange: () => void): (() => void) => {
    if (typeof window === 'undefined') return () => {}
    window.addEventListener(event, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(event, onChange)
      window.removeEventListener('storage', onChange)
    }
  }
}

const subscribeTheme = makeSubscribe(THEME_EVENT)
const subscribeTrack = makeSubscribe(TRACK_EVENT)
const themeServerSnapshot = (): Theme => 'dark'
const trackServerSnapshot = (): TrackId => 'beginner'

// ── Providers ──────────────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, readStoredTheme, themeServerSnapshot)
  const track = useSyncExternalStore(subscribeTrack, getTrack, trackServerSnapshot)

  // Apply theme class to document
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  function setTrack(t: TrackId) {
    persistTrack(t)
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(TRACK_EVENT))
  }

  function toggle() {
    const next: Theme = readStoredTheme() === 'dark' ? 'light' : 'dark'
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_KEY, next)
      window.dispatchEvent(new Event(THEME_EVENT))
    }
  }

  return (
    <TrackContext.Provider value={{ track, setTrack }}>
      <ThemeContext.Provider value={{ theme, toggle }}>
        {children}
      </ThemeContext.Provider>
    </TrackContext.Provider>
  )
}
