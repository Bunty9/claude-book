import { chapterById } from '@/content/manifest'

/**
 * Return a stable import-path string for a known chapter id, or undefined if
 * the chapter doesn't exist in the manifest.
 *
 * Format: `@/content/p<N>/<id>.mdx` derived from the chapter's part field.
 * The actual dynamic import lives in the chapter route page — this function
 * lets tests and callers verify the mapping without triggering a real import.
 */
export function chapterPath(id: string): string | undefined {
  const meta = chapterById(id)
  if (meta === undefined) return undefined
  // part is like 'P0', 'P1', etc. — lowercase for the folder name
  const folder = meta.part.toLowerCase()
  return `@/content/${folder}/${id}.mdx`
}
