import { describe, it, expect } from 'vitest'
import { recommendTrack } from './recommendTrack'

describe('recommendTrack', () => {
  it('automate goal -> automator', () => expect(recommendTrack({ codes: 'pro', goal: 'automate' })).toBe('automator'))
  it('pro coder basics -> engineer', () => expect(recommendTrack({ codes: 'pro', goal: 'basics' })).toBe('engineer'))
  it('build goal -> engineer', () => expect(recommendTrack({ codes: 'none', goal: 'build' })).toBe('engineer'))
  it('newcomer basics -> beginner', () => expect(recommendTrack({ codes: 'none', goal: 'basics' })).toBe('beginner'))
})
