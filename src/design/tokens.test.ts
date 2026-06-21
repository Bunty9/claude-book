import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const css = readFileSync(resolve(import.meta.dirname, 'tokens.css'), 'utf8')

const REQUIRED = [
  '--bg',
  '--fg',
  '--fg-muted',
  '--border',
  '--accent',
  '--accent-fg',
  '--note',
  '--tip',
  '--warning',
  '--danger',
  '--code-bg',
  '--radius',
  '--font-sans',
  '--font-mono',
]

describe('design tokens', () => {
  it('defines all required tokens', () => {
    for (const t of REQUIRED) expect(css).toContain(t)
  })
  it('has a light override block', () => {
    expect(css).toMatch(/\.light\s*\{/)
  })
})
