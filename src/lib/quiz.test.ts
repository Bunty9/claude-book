import { describe, it, expect } from 'vitest'
import {
  isValidQuestion,
  recordAnswer,
  getVerdict,
  isComplete,
  computeSummary,
  gradeLabel,
  type QuizQuestion,
  type AnswerMap,
} from './quiz'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const Q1: QuizQuestion = {
  text: 'What is 2 + 2?',
  options: ['3', '4', '5', '6'],
  correctIndex: 1,
  explanation: 'Basic arithmetic: 2 + 2 equals 4.',
}

const Q2: QuizQuestion = {
  text: 'What colour is the sky on a clear day?',
  options: ['Red', 'Blue', 'Green'],
  correctIndex: 1,
  explanation: 'The sky appears blue due to Rayleigh scattering.',
}

const Q3: QuizQuestion = {
  text: 'Which planet is closest to the Sun?',
  options: ['Venus', 'Earth', 'Mercury', 'Mars'],
  correctIndex: 2,
  explanation: 'Mercury is the innermost planet in the Solar System.',
}

const THREE_QUESTIONS: readonly QuizQuestion[] = [Q1, Q2, Q3]

// ── isValidQuestion ───────────────────────────────────────────────────────────

describe('isValidQuestion', () => {
  it('accepts a well-formed question', () => {
    expect(isValidQuestion(Q1)).toBe(true)
  })

  it('rejects empty question text', () => {
    expect(isValidQuestion({ ...Q1, text: '' })).toBe(false)
    expect(isValidQuestion({ ...Q1, text: '   ' })).toBe(false)
  })

  it('rejects fewer than 2 options', () => {
    expect(isValidQuestion({ ...Q1, options: ['Only one'] })).toBe(false)
  })

  it('rejects a blank option inside the array', () => {
    expect(isValidQuestion({ ...Q1, options: ['A', '', 'C', 'D'] })).toBe(false)
  })

  it('rejects a negative correctIndex', () => {
    expect(isValidQuestion({ ...Q1, correctIndex: -1 })).toBe(false)
  })

  it('rejects a correctIndex equal to options.length (out of bounds)', () => {
    expect(isValidQuestion({ ...Q1, correctIndex: Q1.options.length })).toBe(false)
  })

  it('rejects a non-integer correctIndex', () => {
    expect(isValidQuestion({ ...Q1, correctIndex: 1.5 })).toBe(false)
  })

  it('rejects an empty explanation', () => {
    expect(isValidQuestion({ ...Q1, explanation: '' })).toBe(false)
    expect(isValidQuestion({ ...Q1, explanation: '   ' })).toBe(false)
  })

  it('accepts the last valid index', () => {
    const q: QuizQuestion = { ...Q1, correctIndex: Q1.options.length - 1 }
    expect(isValidQuestion(q)).toBe(true)
  })

  it('accepts a question with 2 options', () => {
    const q: QuizQuestion = {
      text: 'True or false?',
      options: ['True', 'False'],
      correctIndex: 0,
      explanation: 'It is true.',
    }
    expect(isValidQuestion(q)).toBe(true)
  })
})

// ── recordAnswer ─────────────────────────────────────────────────────────────

describe('recordAnswer', () => {
  it('records a fresh answer', () => {
    const before: AnswerMap = {}
    const after = recordAnswer(before, 0, 1)
    expect(after[0]).toBe(1)
  })

  it('does not mutate the original map', () => {
    const before: AnswerMap = {}
    recordAnswer(before, 0, 2)
    expect(before[0]).toBeUndefined()
  })

  it('preserves existing answers', () => {
    const initial: AnswerMap = { 0: 1 }
    const after = recordAnswer(initial, 1, 2)
    expect(after[0]).toBe(1)
    expect(after[1]).toBe(2)
  })

  it('first answer is final — subsequent calls for the same question are no-ops', () => {
    const first = recordAnswer({}, 0, 0)
    const second = recordAnswer(first, 0, 3)
    expect(second[0]).toBe(0) // original choice preserved
  })

  it('returns the identical reference when no change is made', () => {
    const map: AnswerMap = { 0: 2 }
    const result = recordAnswer(map, 0, 1)
    expect(result).toBe(map) // same reference, no new object
  })

  it('can record answers for multiple distinct questions', () => {
    let map: AnswerMap = {}
    map = recordAnswer(map, 0, 1)
    map = recordAnswer(map, 1, 0)
    map = recordAnswer(map, 2, 2)
    expect(map[0]).toBe(1)
    expect(map[1]).toBe(0)
    expect(map[2]).toBe(2)
  })
})

// ── getVerdict ────────────────────────────────────────────────────────────────

describe('getVerdict', () => {
  it('returns "correct" when the chosen index matches', () => {
    expect(getVerdict(Q1, Q1.correctIndex)).toBe('correct')
  })

  it('returns "incorrect" when the chosen index does not match', () => {
    expect(getVerdict(Q1, 0)).toBe('incorrect') // Q1.correctIndex is 1
  })

  it('returns null when chosenIndex is null', () => {
    expect(getVerdict(Q1, null)).toBeNull()
  })

  it('returns null when chosenIndex is undefined', () => {
    expect(getVerdict(Q1, undefined)).toBeNull()
  })

  it('returns "incorrect" for index 0 when correctIndex is not 0', () => {
    // Q2 correctIndex = 1; choosing 0 should be incorrect
    expect(getVerdict(Q2, 0)).toBe('incorrect')
  })

  it('returns "correct" for the last option when it is the correct one', () => {
    const q: QuizQuestion = {
      text: 'Which?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 3,
      explanation: 'D is right.',
    }
    expect(getVerdict(q, 3)).toBe('correct')
  })
})

// ── isComplete ────────────────────────────────────────────────────────────────

describe('isComplete', () => {
  it('returns false for an empty answer map', () => {
    expect(isComplete(THREE_QUESTIONS, {})).toBe(false)
  })

  it('returns false when only some questions are answered', () => {
    expect(isComplete(THREE_QUESTIONS, { 0: 1 })).toBe(false)
    expect(isComplete(THREE_QUESTIONS, { 0: 1, 1: 2 })).toBe(false)
  })

  it('returns true when all questions are answered', () => {
    const full: AnswerMap = { 0: 1, 1: 1, 2: 2 }
    expect(isComplete(THREE_QUESTIONS, full)).toBe(true)
  })

  it('returns false for an empty question list (nothing to answer)', () => {
    expect(isComplete([], {})).toBe(false)
  })

  it('returns true for a single-question quiz once answered', () => {
    expect(isComplete([Q1], { 0: 0 })).toBe(true)
  })

  it('returns false for a single-question quiz not yet answered', () => {
    expect(isComplete([Q1], {})).toBe(false)
  })
})

// ── computeSummary ────────────────────────────────────────────────────────────

describe('computeSummary', () => {
  it('gives a perfect score when all answers are correct', () => {
    const allCorrect: AnswerMap = {
      0: Q1.correctIndex,
      1: Q2.correctIndex,
      2: Q3.correctIndex,
    }
    const summary = computeSummary(THREE_QUESTIONS, allCorrect)
    expect(summary.correct).toBe(3)
    expect(summary.total).toBe(3)
    expect(summary.fraction).toBeCloseTo(1)
    expect(summary.percentLabel).toBe('100%')
  })

  it('gives a zero score when all answers are wrong', () => {
    // All wrong choices (correctIndex is 1 for Q1, Q2; 2 for Q3)
    const allWrong: AnswerMap = { 0: 0, 1: 0, 2: 0 }
    const summary = computeSummary(THREE_QUESTIONS, allWrong)
    expect(summary.correct).toBe(0)
    expect(summary.fraction).toBe(0)
    expect(summary.percentLabel).toBe('0%')
  })

  it('counts unanswered questions as incorrect', () => {
    // Only Q1 answered correctly, Q2 and Q3 unanswered
    const partial: AnswerMap = { 0: Q1.correctIndex }
    const summary = computeSummary(THREE_QUESTIONS, partial)
    expect(summary.correct).toBe(1)
    expect(summary.total).toBe(3)
  })

  it('returns 0 fraction for empty questions array', () => {
    const summary = computeSummary([], {})
    expect(summary.fraction).toBe(0)
    expect(summary.total).toBe(0)
  })

  it('computes a partial score correctly (1 of 3)', () => {
    const answers: AnswerMap = {
      0: Q1.correctIndex,    // correct
      1: 0,                  // incorrect (Q2 correctIndex=1)
      2: 0,                  // incorrect (Q3 correctIndex=2)
    }
    const summary = computeSummary(THREE_QUESTIONS, answers)
    expect(summary.correct).toBe(1)
    expect(summary.fraction).toBeCloseTo(1 / 3)
  })

  it('rounds the percentLabel to the nearest whole number', () => {
    // 1/3 ≈ 33.33% → "33%"
    const answers: AnswerMap = {
      0: Q1.correctIndex,
      1: 0,
      2: 0,
    }
    const summary = computeSummary(THREE_QUESTIONS, answers)
    expect(summary.percentLabel).toBe('33%')
  })

  it('returns total equal to questions.length', () => {
    const summary = computeSummary(THREE_QUESTIONS, {})
    expect(summary.total).toBe(THREE_QUESTIONS.length)
  })
})

// ── gradeLabel ────────────────────────────────────────────────────────────────

describe('gradeLabel', () => {
  it('returns "Perfect" for fraction 1', () => {
    expect(gradeLabel(1)).toBe('Perfect')
  })

  it('returns "Great" for fraction 0.8', () => {
    expect(gradeLabel(0.8)).toBe('Great')
  })

  it('returns "Great" for fraction 0.9', () => {
    expect(gradeLabel(0.9)).toBe('Great')
  })

  it('returns "Good" for fraction 0.6', () => {
    expect(gradeLabel(0.6)).toBe('Good')
  })

  it('returns "Good" for fraction 0.7', () => {
    expect(gradeLabel(0.7)).toBe('Good')
  })

  it('returns "Keep practising" for fraction 0.4', () => {
    expect(gradeLabel(0.4)).toBe('Keep practising')
  })

  it('returns "Keep practising" for fraction 0.5', () => {
    expect(gradeLabel(0.5)).toBe('Keep practising')
  })

  it('returns "Review the chapter" for fraction 0', () => {
    expect(gradeLabel(0)).toBe('Review the chapter')
  })

  it('returns "Review the chapter" for fraction 0.39', () => {
    expect(gradeLabel(0.39)).toBe('Review the chapter')
  })

  it('returns "Perfect" only at exactly 1', () => {
    expect(gradeLabel(0.99)).toBe('Great')
    expect(gradeLabel(1)).toBe('Perfect')
  })
})
