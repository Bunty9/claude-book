import { describe, it, expect } from 'vitest'
import { chapters, chaptersForTrack, chapterById, tracks } from './manifest'

describe('manifest invariants', () => {
  it('has unique ids', () => {
    const ids = chapters.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('each track order is contiguous starting at 1', () => {
    for (const t of tracks) {
      const orders = chaptersForTrack(t).map(c => c.tracks[t]!).sort((a, b) => a - b)
      orders.forEach((o, i) => expect(o).toBe(i + 1))
    }
  })
  it('chaptersForTrack is sorted ascending by that track order', () => {
    for (const t of tracks) {
      const seq = chaptersForTrack(t).map(c => c.tracks[t]!)
      const sorted = [...seq].sort((a, b) => a - b)
      expect(seq).toEqual(sorted)
    }
  })
  it('chapterById resolves a known id and returns undefined for unknown', () => {
    expect(chapterById(chapters[0].id)?.id).toBe(chapters[0].id)
    expect(chapterById('___nope___')).toBeUndefined()
  })
})
