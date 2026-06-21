/**
 * Pure, deterministic quiz logic.
 *
 * A Quiz is a list of multiple-choice questions. Each question has exactly
 * one correct answer (identified by index), four or more option strings, and
 * an explanation shown after the user answers.
 *
 * The module intentionally has no side-effects and no UI concerns.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** A single multiple-choice question. */
export interface QuizQuestion {
  /** The question text shown to the user. */
  text: string
  /** The answer options (minimum 2, no upper bound). */
  options: readonly string[]
  /** Zero-based index of the correct option. */
  correctIndex: number
  /** Explanation revealed after the user picks an answer. */
  explanation: string
}

/** The state of a single question (nothing answered yet → null). */
export type AnswerState = number | null

/**
 * The full answer map for a quiz: sparse — only answered questions are stored.
 * Keyed by question index.
 */
export type AnswerMap = Readonly<Record<number, number>>

/** Verdict for one answered question. */
export type Verdict = 'correct' | 'incorrect'

/** Summary returned after the last question is answered. */
export interface QuizSummary {
  /** Number of correct answers. */
  correct: number
  /** Total number of questions. */
  total: number
  /** Score as a 0–1 fraction. */
  fraction: number
  /** Percentage string e.g. "80%". */
  percentLabel: string
}

// ── Validation ───────────────────────────────────────────────────────────────

/** Returns true when `q` has a valid shape that can be used in a quiz. */
export function isValidQuestion(q: QuizQuestion): boolean {
  if (typeof q.text !== 'string' || q.text.trim().length === 0) return false
  if (!Array.isArray(q.options) || q.options.length < 2) return false
  if (q.options.some(o => typeof o !== 'string' || o.trim().length === 0)) return false
  if (
    typeof q.correctIndex !== 'number' ||
    !Number.isInteger(q.correctIndex) ||
    q.correctIndex < 0 ||
    q.correctIndex >= q.options.length
  ) return false
  if (typeof q.explanation !== 'string' || q.explanation.trim().length === 0) return false
  return true
}

// ── Core logic ───────────────────────────────────────────────────────────────

/**
 * Records a user's answer for a question.
 *
 * Returns a new AnswerMap with the choice recorded. If the question was
 * already answered, the original AnswerMap is returned unchanged (first
 * answer is final — no re-answering allowed).
 */
export function recordAnswer(
  answers: AnswerMap,
  questionIndex: number,
  chosenIndex: number,
): AnswerMap {
  // Already answered — immutable, no change.
  if (questionIndex in answers) return answers
  return { ...answers, [questionIndex]: chosenIndex }
}

/**
 * Returns the verdict for a single answered question, or null if the
 * question has not been answered yet.
 */
export function getVerdict(
  question: QuizQuestion,
  chosenIndex: number | null | undefined,
): Verdict | null {
  if (chosenIndex === null || chosenIndex === undefined) return null
  return chosenIndex === question.correctIndex ? 'correct' : 'incorrect'
}

/**
 * Returns true when every question has been answered.
 */
export function isComplete(questions: readonly QuizQuestion[], answers: AnswerMap): boolean {
  return questions.length > 0 && questions.every((_, i) => i in answers)
}

/**
 * Computes the summary score over all questions.
 * Unanswered questions count as incorrect.
 */
export function computeSummary(
  questions: readonly QuizQuestion[],
  answers: AnswerMap,
): QuizSummary {
  const total = questions.length
  let correct = 0
  for (let i = 0; i < total; i++) {
    const chosen = answers[i]
    if (chosen !== undefined && chosen === questions[i]?.correctIndex) {
      correct++
    }
  }
  const fraction = total > 0 ? correct / total : 0
  const percentLabel = `${Math.round(fraction * 100)}%`
  return { correct, total, fraction, percentLabel }
}

/**
 * Returns a human-readable grade label based on the score fraction.
 *
 * 1.0        → "Perfect"
 * ≥ 0.8      → "Great"
 * ≥ 0.6      → "Good"
 * ≥ 0.4      → "Keep practising"
 * < 0.4      → "Review the chapter"
 */
export function gradeLabel(fraction: number): string {
  if (fraction >= 1) return 'Perfect'
  if (fraction >= 0.8) return 'Great'
  if (fraction >= 0.6) return 'Good'
  if (fraction >= 0.4) return 'Keep practising'
  return 'Review the chapter'
}
