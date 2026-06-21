import { describe, it, expect } from 'vitest'
import { prevNextFor } from './prevNext'

// Fuller coverage arrives as chapters are added.
describe('prevNextFor', () => {
  it('returns empty neighbors for the only chapter in beginner track', () => {
    const result = prevNextFor('what-is-an-llm', 'beginner')
    expect(result.prev).toBeUndefined()
    expect(result.next).toBeUndefined()
  })
  it('returns {} for unknown id', () => {
    const result = prevNextFor('nonexistent-id', 'beginner')
    expect(result.prev).toBeUndefined()
    expect(result.next).toBeUndefined()
  })
})
