import { ChapterMeta, TrackId } from '@/content/types'
import { chaptersForTrack } from '@/content/manifest'

export function prevNextFor(id: string, track: TrackId): { prev?: ChapterMeta; next?: ChapterMeta } {
  const chapters = chaptersForTrack(track)
  const idx = chapters.findIndex(c => c.id === id)
  if (idx === -1) return {}
  return {
    prev: idx > 0 ? chapters[idx - 1] : undefined,
    next: idx < chapters.length - 1 ? chapters[idx + 1] : undefined,
  }
}
