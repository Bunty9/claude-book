import { beforeEach, describe, it, expect } from 'vitest'
import { markDone, unmarkDone, isDone, completion, resumeChapter, doneIds } from './progress'

beforeEach(() => localStorage.clear())

describe('progress', () => {
  it('marks and reads done', () => {
    markDone('what-is-an-llm')
    expect(isDone('what-is-an-llm')).toBe(true)
  })
  it('unmarks correctly', () => {
    markDone('what-is-an-llm')
    unmarkDone('what-is-an-llm')
    expect(isDone('what-is-an-llm')).toBe(false)
  })
  it('doneIds reflects set', () => {
    markDone('what-is-an-llm')
    expect(doneIds()).toContain('what-is-an-llm')
  })
  it('completion math for beginner track', () => {
    // beginner track now has 15 chapters (positions 1-15)
    expect(completion('beginner')).toEqual({ done: 0, total: 15, pct: 0 })
    markDone('what-is-an-llm')
    expect(completion('beginner')).toEqual({ done: 1, total: 15, pct: 7 })
  })
  it('resumeChapter returns first undone then next undone', () => {
    // first undone is position 1 in beginner: what-is-an-llm
    expect(resumeChapter('beginner')).toBe('what-is-an-llm')
    markDone('what-is-an-llm')
    // after marking position 1 done, resume should point to position 2: how-to-use-this-book
    expect(resumeChapter('beginner')).toBe('how-to-use-this-book')
  })
})
