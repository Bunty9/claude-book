import { TrackId } from '@/content/types'
import { chaptersForTrack } from '@/content/manifest'

const STORAGE_KEY = 'cb:progress'

function readIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed
    }
  } catch {
    // ignore parse errors
  }
  return []
}

function writeIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function markDone(id: string): void {
  const ids = readIds()
  if (!ids.includes(id)) writeIds([...ids, id])
}

export function unmarkDone(id: string): void {
  writeIds(readIds().filter(x => x !== id))
}

export function isDone(id: string): boolean {
  return readIds().includes(id)
}

export function doneIds(): string[] {
  return readIds()
}

export function completion(track: TrackId): { done: number; total: number; pct: number } {
  const trackChapters = chaptersForTrack(track)
  const total = trackChapters.length
  if (total === 0) return { done: 0, total: 0, pct: 0 }
  const done = readIds().filter(id => trackChapters.some(c => c.id === id)).length
  return { done, total, pct: Math.round((done / total) * 100) }
}

export function resumeChapter(track: TrackId): string | undefined {
  const done = new Set(readIds())
  return chaptersForTrack(track).find(c => !done.has(c.id))?.id
}
