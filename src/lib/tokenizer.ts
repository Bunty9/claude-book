/**
 * Heuristic token estimator — clearly approximate.
 * Uses chars/4, the standard rough rule of thumb for English text.
 * Do NOT use for billing; use the API's token-count endpoint instead.
 */
export function estimateTokens(text: string): number {
  if (text.trim().length === 0) return 0
  const chars = text.length
  return Math.max(1, Math.round(chars / 4))
}
