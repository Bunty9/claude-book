import { TrackId } from '@/content/types'

export interface PathAnswers {
  codes: 'none' | 'some' | 'pro'
  goal: 'basics' | 'build' | 'automate'
}

/**
 * Recommend a learning track from a two-question quiz.
 * Rules (in priority order):
 *   goal === 'automate'            → 'automator'
 *   codes === 'pro' || goal === 'build' → 'engineer'
 *   else                           → 'beginner'
 */
export function recommendTrack(a: PathAnswers): TrackId {
  if (a.goal === 'automate') return 'automator'
  if (a.codes === 'pro' || a.goal === 'build') return 'engineer'
  return 'beginner'
}
