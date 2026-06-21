import { describe, it, expect } from 'vitest'
import {
  scorePrompt,
  type PromptScore,
  type DimensionScore,
  CURATED_PAIRS,
} from './promptScore'

// ─── scorePrompt shape ────────────────────────────────────────────────────────

describe('scorePrompt — return shape', () => {
  it('returns a PromptScore with four dimensions and a total', () => {
    const result: PromptScore = scorePrompt('Do the thing.')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('dimensions')
    const dims = Object.keys(result.dimensions)
    expect(dims.sort()).toEqual(['constraints', 'examples', 'role', 'specificity'])
  })

  it('each dimension has score, max, label, and feedback', () => {
    const result = scorePrompt('You are an expert. Summarize this in 3 bullet points.')
    const dim: DimensionScore = result.dimensions.specificity
    expect(typeof dim.score).toBe('number')
    expect(typeof dim.max).toBe('number')
    expect(typeof dim.label).toBe('string')
    expect(typeof dim.feedback).toBe('string')
  })

  it('total is non-negative and bounded by sum of maxes', () => {
    const result = scorePrompt('hello')
    const maxPossible = Object.values(result.dimensions).reduce((s, d) => s + d.max, 0)
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(maxPossible)
  })
})

// ─── specificity dimension ────────────────────────────────────────────────────

describe('specificity dimension', () => {
  it('scores low for a very short, vague prompt', () => {
    const vague = scorePrompt('Fix this.')
    const detailed = scorePrompt(
      'Refactor the authentication middleware in src/auth.ts to use async/await ' +
      'instead of callbacks, keeping the same external interface and all existing tests green.',
    )
    expect(vague.dimensions.specificity.score).toBeLessThan(
      detailed.dimensions.specificity.score,
    )
  })

  it('rewards longer, more detailed prompts', () => {
    const short = scorePrompt('Write code.')
    const long = scorePrompt(
      'Write a TypeScript function called calculateTax that takes a number income ' +
      'and returns the federal income tax owed for a single filer in 2024. ' +
      'Use the standard 7-bracket schedule. Return 0 for income below $11,600.',
    )
    expect(long.dimensions.specificity.score).toBeGreaterThan(short.dimensions.specificity.score)
  })
})

// ─── examples dimension ───────────────────────────────────────────────────────

describe('examples dimension', () => {
  it('scores zero when no example signals are present', () => {
    const result = scorePrompt('Summarize the document.')
    expect(result.dimensions.examples.score).toBe(0)
  })

  it('scores positively when "for example" is used', () => {
    const result = scorePrompt('Translate the text. For example, "hello" becomes "hola".')
    expect(result.dimensions.examples.score).toBeGreaterThan(0)
  })

  it('scores positively when "e.g." is used', () => {
    const result = scorePrompt('Clean the data, e.g. trim whitespace and normalise casing.')
    expect(result.dimensions.examples.score).toBeGreaterThan(0)
  })

  it('scores positively when "such as" is present', () => {
    const result = scorePrompt('Handle edge cases such as empty strings and null values.')
    expect(result.dimensions.examples.score).toBeGreaterThan(0)
  })

  it('recognises example delimiters like Input/Output blocks', () => {
    const result = scorePrompt(
      'Convert dates to ISO format.\nInput: "Jan 3 2024"\nOutput: "2024-01-03"',
    )
    expect(result.dimensions.examples.score).toBeGreaterThan(0)
  })
})

// ─── constraints dimension ────────────────────────────────────────────────────

describe('constraints dimension', () => {
  it('scores zero for a prompt with no constraints', () => {
    const result = scorePrompt('Write a story about a cat.')
    expect(result.dimensions.constraints.score).toBe(0)
  })

  it('detects numeric limits like "100 words" or "3 bullet points"', () => {
    const result = scorePrompt('Summarise in 100 words. Use 3 bullet points.')
    expect(result.dimensions.constraints.score).toBeGreaterThan(0)
  })

  it('detects "do not" / "don\'t" / "avoid" / "never" negative instructions', () => {
    const result = scorePrompt('Write the bio. Do not use jargon. Never exceed one paragraph.')
    expect(result.dimensions.constraints.score).toBeGreaterThan(0)
  })

  it('detects format constraints like "in JSON" / "as a list" / "in markdown"', () => {
    const result = scorePrompt('Return the result as a JSON object with keys name and score.')
    expect(result.dimensions.constraints.score).toBeGreaterThan(0)
  })

  it('scores higher when multiple distinct constraints are present', () => {
    const one = scorePrompt('Respond in JSON.')
    const many = scorePrompt(
      'Respond in JSON. Do not include any explanation. Limit to 5 items. ' +
      'Never use nested objects.',
    )
    expect(many.dimensions.constraints.score).toBeGreaterThanOrEqual(
      one.dimensions.constraints.score,
    )
  })
})

// ─── role dimension ───────────────────────────────────────────────────────────

describe('role dimension', () => {
  it('scores zero for a prompt with no role assignment', () => {
    const result = scorePrompt('Explain quantum entanglement.')
    expect(result.dimensions.role.score).toBe(0)
  })

  it('scores positively for "You are a ..." pattern', () => {
    const result = scorePrompt('You are a senior software engineer. Review the PR description.')
    expect(result.dimensions.role.score).toBeGreaterThan(0)
  })

  it('scores positively for "Act as a ..." pattern', () => {
    const result = scorePrompt('Act as a data scientist. Identify outliers in this dataset.')
    expect(result.dimensions.role.score).toBeGreaterThan(0)
  })

  it('scores positively for "As an expert ..." pattern', () => {
    const result = scorePrompt('As an expert in tax law, explain capital gains treatment.')
    expect(result.dimensions.role.score).toBeGreaterThan(0)
  })

  it('scores positively for "Pretend you are ..." pattern', () => {
    const result = scorePrompt('Pretend you are a skeptical peer reviewer.')
    expect(result.dimensions.role.score).toBeGreaterThan(0)
  })
})

// ─── total aggregation ────────────────────────────────────────────────────────

describe('total aggregation', () => {
  it('a fully crafted prompt scores higher than a bare one', () => {
    const bare = scorePrompt('Fix the bug.')
    const crafted = scorePrompt(
      'You are a senior TypeScript engineer. Fix the null-dereference bug in ' +
      'src/api/auth.ts line 42. Do not modify any other files. Do not change ' +
      'function signatures. Return only the corrected function. For example, ' +
      'if the input is `getUser(id)`, the output should guard `id` before use.',
    )
    expect(crafted.total).toBeGreaterThan(bare.total)
  })

  it('total equals the sum of individual dimension scores', () => {
    const result = scorePrompt(
      'You are a copywriter. Write a headline. Keep it under 10 words. ' +
      'For example, "Grow faster with less effort."',
    )
    const sumOfDims = Object.values(result.dimensions).reduce((s, d) => s + d.score, 0)
    expect(result.total).toBe(sumOfDims)
  })
})

// ─── determinism ─────────────────────────────────────────────────────────────

describe('determinism', () => {
  it('returns the same score for the same input', () => {
    const input = 'You are a chef. Give me a recipe for pasta in JSON. Do not include meat.'
    const a = scorePrompt(input)
    const b = scorePrompt(input)
    expect(a.total).toBe(b.total)
    expect(a.dimensions.specificity.score).toBe(b.dimensions.specificity.score)
  })
})

// ─── CURATED_PAIRS ────────────────────────────────────────────────────────────

describe('CURATED_PAIRS', () => {
  it('has at least 4 pairs', () => {
    expect(CURATED_PAIRS.length).toBeGreaterThanOrEqual(4)
  })

  it('each pair has id, label, before, and after', () => {
    for (const pair of CURATED_PAIRS) {
      expect(typeof pair.id).toBe('string')
      expect(typeof pair.label).toBe('string')
      expect(typeof pair.before).toBe('string')
      expect(typeof pair.after).toBe('string')
    }
  })

  it('every "after" prompt scores strictly higher than the matching "before"', () => {
    for (const pair of CURATED_PAIRS) {
      const beforeScore = scorePrompt(pair.before).total
      const afterScore = scorePrompt(pair.after).total
      expect(afterScore).toBeGreaterThan(beforeScore)
    }
  })
})
