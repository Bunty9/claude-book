import { describe, it, expect } from 'vitest'
import { MODELS, costFor, costBoth } from './cost'
describe('cost', () => {
  it('has the three core models', () => { expect(MODELS.map(m => m.id)).toEqual(['claude-opus-4-8','claude-sonnet-4-6','claude-haiku-4-5']) })
  it('computes per-kind cost', () => {
    const sonnet = MODELS.find(m => m.id === 'claude-sonnet-4-6'); if (!sonnet) throw new Error('missing')
    expect(costFor(1_000_000, sonnet, 'input')).toBeCloseTo(3)
    expect(costFor(1_000_000, sonnet, 'output')).toBeCloseTo(15)
  })
  it('costBoth totals', () => {
    const opus = MODELS.find(m => m.id === 'claude-opus-4-8'); if (!opus) throw new Error('missing')
    const r = costBoth(1_000_000, 1_000_000, opus)
    expect(r.input).toBeCloseTo(15); expect(r.output).toBeCloseTo(75); expect(r.total).toBeCloseTo(90)
  })
})
