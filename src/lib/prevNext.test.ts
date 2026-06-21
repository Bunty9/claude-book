import { describe, it, expect } from 'vitest'
import { prevNextFor } from './prevNext'

// Fuller coverage arrives as chapters are added.
describe('prevNextFor', () => {
  it('returns no prev but has next for the first chapter in beginner track', () => {
    // what-is-an-llm is position 1 in beginner; it has no prev but does have a next
    const result = prevNextFor('what-is-an-llm', 'beginner')
    expect(result.prev).toBeUndefined()
    expect(result.next?.id).toBe('how-to-use-this-book')
  })
  it('returns {} for unknown id', () => {
    const result = prevNextFor('nonexistent-id', 'beginner')
    expect(result.prev).toBeUndefined()
    expect(result.next).toBeUndefined()
  })
})
