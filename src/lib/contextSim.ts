/**
 * contextSim.ts — pure, deterministic logic for the ContextWindowSim widget.
 *
 * Models a Claude Code session as an append-only sequence of turns, each
 * consuming a known number of tokens. Supports lean vs. bloated presets,
 * fill-ratio computation, and a compaction-trigger threshold.
 *
 * No React, no side-effects, no randomness. All functions are deterministic
 * given the same inputs so the widget renders identically on every SSR pass.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** The "role" of a message in the context window, mirroring the Claude API. */
export type TurnRole = 'user' | 'assistant' | 'tool-result'

/**
 * The semantic kind of each turn — drives label text and colour hints in the
 * UI. `tool-result` kind maps to `tool-result` role; all others are either
 * `user` (even turns 0, 2, 4 …) or `assistant` (odd turns 1, 3, 5 …).
 */
export type TurnKind = 'message' | 'tool-result' | 'file-read' | 'search'

/** One entry in the simulated context window. */
export interface SimTurn {
  /** Zero-based position in the session turn list. */
  index: number
  /** API role of this message. */
  role: TurnRole
  /** Semantic kind — used for colouring and labelling. */
  kind: TurnKind
  /** Approximate token cost of this turn. */
  tokenCost: number
  /** Short human-readable label for the UI. */
  label: string
}

/** A complete simulated session snapshot. */
export interface SimSession {
  /** System prompt + tool-definition token cost (static, always present). */
  systemTokens: number
  /** Ordered list of conversation turns (does not include the system block). */
  turns: SimTurn[]
  /** systemTokens + sum of all turn tokenCosts. */
  totalTokens: number
}

// ── Preset definition ────────────────────────────────────────────────────────

export interface SimPreset {
  /** Display name shown in the UI selector. */
  label: string
  /** One-sentence explanation shown below the selector. */
  description: string
  /**
   * System prompt + tool-definition overhead.
   * Lean: small CLAUDE.md + few tools.
   * Bloated: large CLAUDE.md + many tools + large injected docs.
   */
  systemTokens: number
  /**
   * Per-turn token costs, indexed by turn position modulo the array length.
   * Allows a repeating pattern of realistic turn sizes.
   *
   * Index 0 = user prompt, 1 = assistant reply, 2 = tool-result / file-read,
   * 3 = assistant summary, 4 = user follow-up, 5 = assistant reply, …
   */
  turnPattern: ReadonlyArray<{
    role: TurnRole
    kind: TurnKind
    tokenCost: number
    label: string
  }>
}

export const PRESETS: Readonly<Record<'lean' | 'bloated', SimPreset>> = {
  lean: {
    label: 'Lean session',
    description:
      'Short CLAUDE.md, minimal tools, concise messages — context fills slowly.',
    systemTokens: 2_000,
    turnPattern: [
      { role: 'user',      kind: 'message', tokenCost: 120,  label: 'User prompt'       },
      { role: 'assistant', kind: 'message', tokenCost: 340,  label: 'Assistant reply'   },
      { role: 'user',      kind: 'message', tokenCost: 90,   label: 'User follow-up'    },
      { role: 'assistant', kind: 'message', tokenCost: 280,  label: 'Assistant reply'   },
    ],
  },
  bloated: {
    label: 'Bloated session',
    description:
      'Large CLAUDE.md, many tools, file reads injected as tool results — context fills fast.',
    systemTokens: 18_000,
    turnPattern: [
      { role: 'user',        kind: 'message',     tokenCost: 350,   label: 'User prompt'      },
      { role: 'assistant',   kind: 'message',     tokenCost: 820,   label: 'Assistant reply'  },
      { role: 'tool-result', kind: 'file-read',   tokenCost: 4_200, label: 'File read result' },
      { role: 'assistant',   kind: 'message',     tokenCost: 1_100, label: 'Assistant reply'  },
      { role: 'tool-result', kind: 'search',      tokenCost: 2_800, label: 'Search result'    },
      { role: 'assistant',   kind: 'message',     tokenCost: 960,   label: 'Assistant reply'  },
      { role: 'user',        kind: 'message',     tokenCost: 480,   label: 'User follow-up'   },
      { role: 'assistant',   kind: 'message',     tokenCost: 1_240, label: 'Assistant reply'  },
    ],
  },
}

// ── Core logic ───────────────────────────────────────────────────────────────

/**
 * Build a session snapshot from a preset key and a number of turns to include.
 * Purely deterministic — no randomness, no side-effects.
 */
export function buildSession(
  preset: 'lean' | 'bloated',
  turnCount: number,
): SimSession {
  const p = PRESETS[preset]
  const pattern = p.turnPattern
  const patLen = pattern.length

  const turns: SimTurn[] = []
  for (let i = 0; i < turnCount; i++) {
    const template = pattern[i % patLen]
    turns.push({
      index: i,
      role: template.role,
      kind: template.kind,
      tokenCost: template.tokenCost,
      label: template.label,
    })
  }

  const turnSum = turns.reduce((acc, t) => acc + t.tokenCost, 0)
  return {
    systemTokens: p.systemTokens,
    turns,
    totalTokens: p.systemTokens + turnSum,
  }
}

/**
 * Returns the fill ratio [0, 1] of the context window.
 * Clamped so it never exceeds 1.0 even if totalTokens > budget.
 */
export function computeFill(totalTokens: number, budget: number): number {
  if (budget <= 0) return 0
  return Math.min(1, totalTokens / budget)
}

/**
 * The fraction of the context window at which automatic compaction triggers.
 * Claude Code compacts when the context is ~85 % full (by convention; not an
 * official documented figure, but widely observed in practice — treat as
 * illustrative for the book).
 */
export function compactionThreshold(): number {
  return 0.85
}

// ── Budget options ───────────────────────────────────────────────────────────

/** Named token budget options surfaced in the slider. */
export interface BudgetOption {
  label: string
  tokens: number
}

export const BUDGET_OPTIONS: ReadonlyArray<BudgetOption> = [
  { label: '32 K',  tokens: 32_000  },
  { label: '64 K',  tokens: 64_000  },
  { label: '100 K', tokens: 100_000 },
  { label: '200 K', tokens: 200_000 },
]

/** Maximum number of turns the UI slider allows. */
export const MAX_TURNS = 30

/**
 * Format a raw token count into a compact readable string.
 * e.g. 18_500 → "18.5 K", 200_000 → "200 K", 340 → "340"
 */
export function formatTokens(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)} K`
  return String(n)
}
