import { chapters } from '@/content/manifest'
import { SearchDoc } from './searchIndex'

/**
 * Fetch plaintext bodies from the build-time generated JSON, then join with
 * manifest metadata (title, summary, part) to produce SearchDoc[].
 *
 * Title, summary, and part come from the manifest (authoritative).
 * Body comes from the pre-built JSON (may be empty string if no MDX yet).
 */
export async function loadSearchDocs(): Promise<SearchDoc[]> {
  let bodies: Record<string, string> = {}
  try {
    const res = await fetch('/search-bodies.json')
    if (res.ok) {
      const json: unknown = await res.json()
      if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
        bodies = json as Record<string, string>
      }
    }
  } catch {
    // Network unavailable or parse error — proceed with empty bodies
  }

  return chapters.map(c => ({
    id: c.id,
    title: c.title,
    summary: c.summary,
    part: c.part,
    body: bodies[c.id] ?? '',
  }))
}
