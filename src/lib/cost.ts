// Indicative public list prices; reconcile against research packet C (Task 1.3) before publishing pricing claims.

export interface ModelPrice {
  id: string
  label: string
  inputPerM: number   // USD per 1M input tokens
  outputPerM: number  // USD per 1M output tokens
}

export const MODELS: ModelPrice[] = [
  { id: 'claude-opus-4-8',   label: 'Opus 4.8',   inputPerM: 15,  outputPerM: 75 },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', inputPerM: 3,   outputPerM: 15 },
  { id: 'claude-haiku-4-5',  label: 'Haiku 4.5',  inputPerM: 0.8, outputPerM: 4  },
]

/** Returns USD cost for `tokens` tokens on a single side (input or output). */
export function costFor(
  tokens: number,
  model: ModelPrice,
  kind: 'input' | 'output',
): number {
  const perM = kind === 'input' ? model.inputPerM : model.outputPerM
  return (tokens / 1_000_000) * perM
}

/** Returns input, output, and combined cost for a round-trip call. */
export function costBoth(
  inputTokens: number,
  outputTokens: number,
  model: ModelPrice,
): { input: number; output: number; total: number } {
  const input = costFor(inputTokens, model, 'input')
  const output = costFor(outputTokens, model, 'output')
  return { input, output, total: input + output }
}
