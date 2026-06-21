import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BODIES_PATH = join(__dirname, '../../public/search-bodies.json')

function isBodyMap(j: unknown): j is Record<string, string> {
  return (
    typeof j === 'object' &&
    j !== null &&
    !Array.isArray(j) &&
    Object.values(j).every(v => typeof v === 'string')
  )
}

describe('search-bodies.json completeness', () => {
  it('has a non-empty body for every manifest chapter', async () => {
    const { chapters } = await import('@/content/manifest')
    const raw = readFileSync(BODIES_PATH, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    expect(isBodyMap(parsed)).toBe(true)
    if (!isBodyMap(parsed)) return
    for (const chapter of chapters) {
      const body = parsed[chapter.id]
      expect(body, `chapter "${chapter.id}" has no body in search-bodies.json`).toBeDefined()
      expect(body, `chapter "${chapter.id}" has empty body in search-bodies.json`).not.toBe('')
    }
  })
})
