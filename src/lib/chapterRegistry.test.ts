import { describe, it, expect } from 'vitest'

describe('chapter registry completeness', () => {
  it('every manifest chapter id is registered in CHAPTERS_MDX', async () => {
    const { chapters } = await import('@/content/manifest')
    const { REGISTERED_CHAPTER_IDS } = await import('@/app/(book)/c/[id]/chapterMdxRegistry')
    const registered = new Set(REGISTERED_CHAPTER_IDS)
    for (const chapter of chapters) {
      expect(
        registered.has(chapter.id),
        `chapter "${chapter.id}" is in the manifest but not registered in CHAPTERS_MDX`
      ).toBe(true)
    }
  })
})
