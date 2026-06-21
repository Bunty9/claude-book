import { beforeEach, describe, it, expect } from 'vitest'
import { getTrack, setTrack, DEFAULT_TRACK } from './track'

beforeEach(() => localStorage.clear())

describe('track', () => {
  it('returns DEFAULT_TRACK when unset', () => {
    expect(getTrack()).toBe(DEFAULT_TRACK)
  })
  it('roundtrips set → get', () => {
    setTrack('engineer')
    expect(getTrack()).toBe('engineer')
  })
  it('falls back to default when stored value is invalid', () => {
    localStorage.setItem('cb:track', 'not-a-track')
    expect(getTrack()).toBe(DEFAULT_TRACK)
  })
})
