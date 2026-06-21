import { describe, it, expect } from 'vitest'
import { chapterPath } from './loadChapter'

describe('chapterPath', () => {
  it('returns a defined string for a known chapter id', () => {
    const result = chapterPath('what-is-an-llm')
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result).toContain('what-is-an-llm')
  })

  it('returns undefined for an unknown chapter id', () => {
    expect(chapterPath('___nope___')).toBeUndefined()
  })
})
