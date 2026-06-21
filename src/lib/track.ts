import { TRACKS, TrackId } from '@/content/types'

export const DEFAULT_TRACK: TrackId = 'beginner'

const STORAGE_KEY = 'cb:track'

function isTrackId(value: string): value is TrackId {
  return TRACKS.some((t) => t === value)
}

export function getTrack(): TrackId {
  if (typeof window === 'undefined') return DEFAULT_TRACK
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null && isTrackId(stored)) return stored
  return DEFAULT_TRACK
}

export function setTrack(t: TrackId): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, t)
}
