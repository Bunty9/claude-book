import { describe, it, expect } from 'vitest'
import { buildIndex, search } from './searchIndex'

const docs = [
  { id: 'a', title: 'Context window and compaction', summary: 'how context fills', body: 'autocompact triggers when the window is full', part: 'P3' },
  { id: 'b', title: 'Worktrees', summary: 'isolation for parallel work', body: 'git worktree per feature branch', part: 'P5' },
]

describe('search index', () => {
  it('returns the matching doc first for a clear query', () => {
    const idx = buildIndex(docs)
    const hits = search(idx, 'compaction')
    expect(hits[0].id).toBe('a')
  })
  it('matches on title with prefix', () => {
    const idx = buildIndex(docs)
    const hits = search(idx, 'worktr')
    expect(hits.map(h => h.id)).toContain('b')
  })
  it('returns hits carrying stored fields', () => {
    const idx = buildIndex(docs)
    const hits = search(idx, 'context')
    expect(hits[0].part).toBe('P3')
    expect(hits[0].title).toContain('Context')
  })
  it('returns empty array for no match', () => {
    const idx = buildIndex(docs)
    expect(search(idx, 'zzzznotathing')).toEqual([])
  })
})
