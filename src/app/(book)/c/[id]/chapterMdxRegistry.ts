import React from 'react'

/**
 * Explicit map of chapter id → lazy MDX module factory.
 * Add an entry here when a new chapter MDX file is authored.
 * Keeping this explicit (not a template-literal import) lets Next's static
 * export bundler analyse all branches at build time.
 */
export const CHAPTERS_MDX: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  'what-is-an-llm': () => import('@/content/p0/what-is-an-llm.mdx'),
}

/**
 * The set of chapter ids registered in CHAPTERS_MDX.
 * Used by tests to verify that every manifest chapter has an MDX entry.
 */
export const REGISTERED_CHAPTER_IDS: readonly string[] = Object.keys(CHAPTERS_MDX)
