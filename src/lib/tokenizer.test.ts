import { describe, it, expect } from 'vitest'
import { estimateTokens } from './tokenizer'
describe('estimateTokens', () => {
  it('is 0 for empty/whitespace', () => { expect(estimateTokens('')).toBe(0); expect(estimateTokens('   ')).toBe(0) })
  it('grows with length', () => { expect(estimateTokens('hello world this is a test sentence')).toBeGreaterThan(estimateTokens('hi')) })
  it('roughly chars/4 for a known string', () => {
    const s = 'a'.repeat(40); expect(estimateTokens(s)).toBe(10)
  })
})
