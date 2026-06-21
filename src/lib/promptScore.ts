/**
 * promptScore.ts — rule-based, deterministic prompt quality scorer.
 *
 * Four dimensions: specificity, examples, constraints, role.
 * Each dimension is purely additive; no LLM call, no randomness.
 *
 * Exported types are intentionally narrow — no `any`, no `as`, no `!`.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DimensionScore {
  /** Raw points earned in this dimension. */
  score: number
  /** Maximum points possible in this dimension. */
  max: number
  /** Human-readable dimension label. */
  label: string
  /** Short feedback sentence about what was detected (or missing). */
  feedback: string
}

export interface PromptScore {
  /** Sum of all dimension scores. */
  total: number
  /** Individual breakdown per dimension. */
  dimensions: {
    specificity: DimensionScore
    examples: DimensionScore
    constraints: DimensionScore
    role: DimensionScore
  }
}

export interface CuratedPair {
  /** Unique slug used as React key. */
  id: string
  /** Short scenario name shown in the UI. */
  label: string
  /** A weak, vague prompt. */
  before: string
  /** A strengthened version of the same task. */
  after: string
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

/** True when the string contains the pattern (case-insensitive). */
function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text)
}

/** Count non-overlapping matches of a pattern in text. */
function countMatches(text: string, pattern: RegExp): number {
  const global = new RegExp(pattern.source, `${pattern.flags.includes('g') ? '' : 'g'}i`)
  return (text.match(global) ?? []).length
}

// ─── Dimension: Specificity ───────────────────────────────────────────────────

const SPECIFICITY_MAX = 30

/**
 * Heuristic based on prompt length (word count) and presence of
 * file paths, line numbers, technical identifiers, and action verbs.
 */
function scoreSpecificity(lower: string, words: string[]): DimensionScore {
  const wordCount = words.length

  // Length tier — longer prompts earn more base points (cap at 20)
  const lengthScore = Math.min(20, Math.floor(wordCount / 5) * 2)

  // Bonus: file path reference (src/, .ts, .tsx, .py, .js, /, \)
  const hasFilePath = has(lower, /(?:src\/|lib\/|app\/|[\w.-]+\.(?:ts|tsx|js|jsx|py|go|rs|java|md))/i)
  // Bonus: line number reference
  const hasLineRef = has(lower, /\bline\s+\d+\b/)
  // Bonus: function or method name (camelCase or snake_case identifier)
  const hasFuncRef = has(lower, /\b[a-z][a-zA-Z0-9]{2,}\(/)
  // Bonus: action verb that implies clear deliverable
  const hasActionVerb = has(lower, /\b(?:refactor|implement|add|remove|fix|rename|extract|migrate|convert|replace|generate|write|create|delete|update|move)\b/)

  const bonuses =
    (hasFilePath ? 3 : 0) +
    (hasLineRef ? 2 : 0) +
    (hasFuncRef ? 2 : 0) +
    (hasActionVerb ? 3 : 0)

  const score = Math.min(SPECIFICITY_MAX, lengthScore + bonuses)

  let feedback: string
  if (score >= 24) {
    feedback = 'Great detail: clear scope, named artefacts, and a concrete deliverable.'
  } else if (score >= 14) {
    feedback = 'Decent scope — consider naming files, functions, or line numbers.'
  } else if (score >= 6) {
    feedback = 'Fairly short. Add what, where, and why for a sharper result.'
  } else {
    feedback = 'Very vague. Tell Claude exactly what to do and where.'
  }

  return { score, max: SPECIFICITY_MAX, label: 'Specificity', feedback }
}

// ─── Dimension: Examples ─────────────────────────────────────────────────────

const EXAMPLES_MAX = 25

const EXAMPLE_SIGNALS: RegExp[] = [
  /\bfor example\b/i,
  /\be\.g\./i,
  /\bsuch as\b/i,
  /\blike this\b/i,
  /\bfor instance\b/i,
  /\binput\s*:/i,
  /\boutput\s*:/i,
  /\bexpected\s*:/i,
  /\bsample\s*:/i,
  /→|=>/,              // arrow notation often used in before→after examples
]

function scoreExamples(lower: string): DimensionScore {
  const hits = EXAMPLE_SIGNALS.filter(rx => has(lower, rx)).length
  // Each unique signal type earns points, cap at max
  const score = Math.min(EXAMPLES_MAX, hits * 9)

  let feedback: string
  if (score >= 18) {
    feedback = 'Excellent — multiple example signals help Claude calibrate the format and style.'
  } else if (score > 0) {
    feedback = 'Good start. Adding a concrete before/after pair boosts accuracy further.'
  } else {
    feedback = 'No examples detected. Show Claude the desired input/output format.'
  }

  return { score, max: EXAMPLES_MAX, label: 'Examples', feedback }
}

// ─── Dimension: Constraints ───────────────────────────────────────────────────

const CONSTRAINTS_MAX = 25

const NEGATIVE_PATTERNS: RegExp[] = [
  /\bdo not\b/i,
  /\bdon't\b/i,
  /\bavoid\b/i,
  /\bnever\b/i,
  /\bwithout\b/i,
  /\bexclude\b/i,
]

const FORMAT_PATTERNS: RegExp[] = [
  /\bin json\b/i,
  /\bas (?:a )?json\b/i,
  /\bin markdown\b/i,
  /\bas markdown\b/i,
  /\bas a list\b/i,
  /\bin (?:a )?(?:numbered|bulleted|bullet) list\b/i,
  /\bin (?:a )?table\b/i,
  /\bas (?:a )?(?:numbered|bulleted|bullet) list\b/i,
  /\bin plain text\b/i,
  /\bin (?:a )?single (?:sentence|paragraph|line)\b/i,
  /\bonly (?:return|output|respond with)\b/i,
  /\breturn only\b/i,
]

const NUMERIC_LIMIT: RegExp = /\b\d+\s*(?:words?|characters?|chars?|lines?|items?|sentences?|bullet points?|paragraphs?|steps?|examples?|tokens?)\b/i

function scoreConstraints(lower: string): DimensionScore {
  const negativeHits = NEGATIVE_PATTERNS.filter(rx => has(lower, rx)).length
  const formatHits = FORMAT_PATTERNS.filter(rx => has(lower, rx)).length
  const numericHits = countMatches(lower, NUMERIC_LIMIT)

  // Each unique category earns points, stacking within cap
  const score = Math.min(
    CONSTRAINTS_MAX,
    negativeHits * 5 + formatHits * 7 + numericHits * 5,
  )

  let feedback: string
  if (score >= 18) {
    feedback = 'Strong guardrails — Claude knows what to avoid and what shape output should take.'
  } else if (score > 0) {
    feedback = 'Some constraints found. Adding format and length limits tightens output.'
  } else {
    feedback = 'No constraints detected. Tell Claude the format, length, and what to omit.'
  }

  return { score, max: CONSTRAINTS_MAX, label: 'Constraints', feedback }
}

// ─── Dimension: Role ─────────────────────────────────────────────────────────

const ROLE_MAX = 20

const ROLE_PATTERNS: RegExp[] = [
  /\byou are (?:a|an|the)\b/i,
  /\bact as (?:a|an|the)\b/i,
  /\bacting as (?:a|an|the)\b/i,
  /\bas (?:a|an) expert\b/i,
  /\bas (?:a|an) (?:senior|junior|lead|principal|staff)\b/i,
  /\bpretend (?:you are|to be)\b/i,
  /\bimagine you(?:'re| are)\b/i,
  /\byour role is\b/i,
  /\btake on the role\b/i,
]

function scoreRole(lower: string): DimensionScore {
  const hits = ROLE_PATTERNS.filter(rx => has(lower, rx)).length
  // Any role signal earns full credit; multiple earn a small bonus up to max
  const score = Math.min(ROLE_MAX, hits > 0 ? 15 + Math.min(5, (hits - 1) * 3) : 0)

  let feedback: string
  if (score >= 18) {
    feedback = 'Clear role and persona — Claude can calibrate tone and depth accordingly.'
  } else if (score > 0) {
    feedback = 'Role detected. Specifying seniority or domain sharpens the persona.'
  } else {
    feedback = 'No role set. Opening with "You are a [expert]" improves answer quality.'
  }

  return { score, max: ROLE_MAX, label: 'Role', feedback }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Score a prompt across four quality dimensions.
 * Deterministic and pure — no network calls, no randomness.
 */
export function scorePrompt(prompt: string): PromptScore {
  const lower = prompt.toLowerCase()
  const words = prompt.trim().split(/\s+/).filter(w => w.length > 0)

  const specificity = scoreSpecificity(lower, words)
  const examples = scoreExamples(lower)
  const constraints = scoreConstraints(lower)
  const role = scoreRole(lower)

  const total = specificity.score + examples.score + constraints.score + role.score

  return {
    total,
    dimensions: { specificity, examples, constraints, role },
  }
}

// ─── Curated before/after pairs ───────────────────────────────────────────────

/**
 * Real-world scenarios where adding role, examples, and constraints
 * dramatically improves Claude's output. Every "after" prompt must
 * score strictly higher than its "before" — verified by promptScore.test.ts.
 */
export const CURATED_PAIRS: CuratedPair[] = [
  {
    id: 'code-review',
    label: 'Code review',
    before: 'Review my code.',
    after:
      'You are a senior TypeScript engineer. Review the function in src/lib/auth.ts. ' +
      'Focus on type safety, error handling, and edge cases. ' +
      'Do not comment on style or formatting. ' +
      'Return feedback as a numbered list, one issue per item. ' +
      'For example: "1. getUser() can return null but the caller does not guard it."',
  },
  {
    id: 'summarise',
    label: 'Document summary',
    before: 'Summarise this.',
    after:
      'You are an expert technical writer. Summarise the following document in exactly ' +
      '3 bullet points, each under 20 words. Do not include any introduction or conclusion. ' +
      'Return only the bullet list in markdown format. ' +
      'For example: "- The system uses event-sourcing to record state changes."',
  },
  {
    id: 'sql-query',
    label: 'SQL query',
    before: 'Write a SQL query.',
    after:
      'You are a database engineer. Write a PostgreSQL 16 query that returns the top 10 ' +
      'customers by total order value in the last 30 days. ' +
      'Join orders and customers tables on customer_id. ' +
      'Do not use subqueries — use CTEs only. ' +
      'Return the result as a single SQL statement with no explanation. ' +
      'For example, the output format should be: "WITH cte AS (...) SELECT ... FROM cte;"',
  },
  {
    id: 'email-draft',
    label: 'Email draft',
    before: 'Write an email.',
    after:
      'You are an experienced B2B account executive. Draft a follow-up email to a prospect ' +
      'who attended a demo 3 days ago but has not responded. ' +
      'Keep it under 100 words. Do not use jargon. Never use the phrase "just checking in". ' +
      'Use a friendly but professional tone. ' +
      'Return only the email body — no subject line, no salutation padding. ' +
      'For example, open with the value they mentioned caring about in the demo.',
  },
  {
    id: 'refactor',
    label: 'Refactor code',
    before: 'Refactor this function.',
    after:
      'You are a principal software engineer. Refactor the parseDate function in ' +
      'src/utils/date.ts to use async/await instead of callback-style error handling. ' +
      'Do not change the function signature or return type. ' +
      'Do not modify any other files. ' +
      'Return only the updated function body — no surrounding context. ' +
      'For example, replace callback(err, result) with try/catch and return result.',
  },
]
