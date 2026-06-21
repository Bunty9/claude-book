/**
 * tddLoop.ts — pure, deterministic data for the TDDLoopVisualizer widget.
 *
 * Models the Red → Green → Refactor TDD cycle, annotating each phase with:
 *   - what a human developer does
 *   - where an AI agent plugs in
 *   - the concrete artefacts produced
 *   - transitions to the next phase(s)
 *
 * No side-effects. Safe in server or client components.
 */

// ---------------------------------------------------------------------------
// Phase identity
// ---------------------------------------------------------------------------

export type PhaseId = 'red' | 'green' | 'refactor'

// ---------------------------------------------------------------------------
// Agent role per phase
// ---------------------------------------------------------------------------

export interface AgentRole {
  /** Short verb phrase: what the agent does in this phase */
  readonly action: string
  /** Examples of concrete prompts / tool calls the agent makes */
  readonly examples: readonly string[]
  /** Approximate share of the cognitive work the agent contributes (0–1) */
  readonly agentLoad: number
}

// ---------------------------------------------------------------------------
// Artefact produced at the end of each phase
// ---------------------------------------------------------------------------

export interface PhaseArtefact {
  /** File or concept produced */
  readonly label: string
  /** Brief note on what makes this artefact good or bad */
  readonly note: string
}

// ---------------------------------------------------------------------------
// Full phase descriptor
// ---------------------------------------------------------------------------

export interface TDDPhase {
  readonly id: PhaseId
  /** One-word display label */
  readonly label: string
  /** Sentence explaining the goal of the phase */
  readonly goal: string
  /** Detailed explanation (shown in the detail panel) */
  readonly description: string
  /** What a human developer typically does here */
  readonly humanRole: string
  /** AI agent's involvement */
  readonly agentRole: AgentRole
  /** Artefact produced when the phase succeeds */
  readonly artefact: PhaseArtefact
  /** Semantic colour token role */
  readonly role: 'danger' | 'tip' | 'accent'
}

// ---------------------------------------------------------------------------
// Transition between phases
// ---------------------------------------------------------------------------

export interface TDDTransition {
  readonly from: PhaseId
  readonly to: PhaseId
  /** Condition that enables this transition */
  readonly condition: string
}

// ---------------------------------------------------------------------------
// Phase data — grounded in standard TDD + Claude Code agent loop context
// ---------------------------------------------------------------------------

export const TDD_PHASES: readonly TDDPhase[] = [
  {
    id: 'red',
    label: 'Red',
    goal: 'Write a failing test that precisely specifies desired behaviour.',
    description:
      'A test is written before any implementation exists. The test suite ' +
      'runs and the new test fails (the test runner shows red). This forces ' +
      'you to think about the interface — what the function should accept and ' +
      'return — before writing a single line of implementation. A good failing ' +
      'test is small, focused, and fails for exactly the right reason (wrong ' +
      'output, not a syntax error or import failure).',
    humanRole:
      'Define the behaviour contract: name the function, choose argument ' +
      'shapes, and write the assertion that captures the expected result.',
    agentRole: {
      action: 'Draft test cases from a prose specification',
      examples: [
        '"Write a vitest test for estimateTokens that passes empty string → 0"',
        '"Generate edge-case tests: empty input, whitespace-only, single char"',
        '"Turn this acceptance criterion into three Vitest it() blocks"',
      ],
      agentLoad: 0.8,
    },
    artefact: {
      label: 'Failing test file (*.test.ts)',
      note: 'Suite runs — the new test is red. All existing tests stay green.',
    },
    role: 'danger',
  },
  {
    id: 'green',
    label: 'Green',
    goal: 'Write the minimum code to make all failing tests pass.',
    description:
      'Implementation is written with one objective: make the test suite ' +
      'turn green. No extra features, no premature optimisation. If the ' +
      'simplest implementation that passes is a hard-coded constant, that ' +
      'is acceptable — the next test will force something more general. ' +
      'Committing the first passing version creates a safety net for the ' +
      'refactor phase.',
    humanRole:
      'Implement the function body using the correct algorithm; validate ' +
      'by running the test suite locally.',
    agentRole: {
      action: 'Generate minimal implementation that passes the red tests',
      examples: [
        '"Implement estimateTokens to make the test file pass — keep it simple"',
        '"Write only what is needed; do not add untested logic"',
        '"Run vitest after each change; stop when the suite is green"',
      ],
      agentLoad: 0.9,
    },
    artefact: {
      label: 'Passing implementation (*.ts)',
      note: 'All tests green. Code may be rough — that is fine at this stage.',
    },
    role: 'tip',
  },
  {
    id: 'refactor',
    label: 'Refactor',
    goal: 'Improve internal structure without changing observable behaviour.',
    description:
      'With a green test suite as a safety net, the code is cleaned up: ' +
      'duplicate logic extracted, names clarified, performance improved, ' +
      'type safety tightened. The tests must still pass after every change. ' +
      'Refactor in tiny steps — run the suite after each one. The phase ends ' +
      'when the code is clear and the suite is still fully green, ready for ' +
      'the next Red phase.',
    humanRole:
      'Identify structural problems — duplication, unclear names, brittle ' +
      'patterns — and apply focused improvements.',
    agentRole: {
      action: 'Suggest and apply targeted cleanups while keeping tests green',
      examples: [
        '"Refactor this function: extract the normalisation logic, no behaviour change"',
        '"Rename variables for clarity; run tests after each rename"',
        '"Replace the duplicated guard clause with a shared helper"',
      ],
      agentLoad: 0.7,
    },
    artefact: {
      label: 'Cleaned implementation (*.ts) — tests still green',
      note: 'Same external behaviour, better internal structure. Ready for the next Red.',
    },
    role: 'accent',
  },
]

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export const TDD_TRANSITIONS: readonly TDDTransition[] = [
  {
    from: 'red',
    to: 'green',
    condition: 'New test is committed and the suite shows at least one failure',
  },
  {
    from: 'green',
    to: 'refactor',
    condition: 'All tests pass (suite is fully green)',
  },
  {
    from: 'refactor',
    to: 'red',
    condition: 'Code is clean; suite still green — begin the next increment',
  },
]

// ---------------------------------------------------------------------------
// Composed export
// ---------------------------------------------------------------------------

export interface TDDLoop {
  readonly phases: readonly TDDPhase[]
  readonly transitions: readonly TDDTransition[]
}

export const TDD_LOOP: TDDLoop = {
  phases: TDD_PHASES,
  transitions: TDD_TRANSITIONS,
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** Return the phase descriptor for a given id, or undefined. */
export function findPhase(id: PhaseId): TDDPhase | undefined {
  return TDD_PHASES.find(p => p.id === id)
}

/** Return the transition that departs from a given phase, or undefined. */
export function nextTransition(from: PhaseId): TDDTransition | undefined {
  return TDD_TRANSITIONS.find(t => t.from === from)
}

/** Return the transition that arrives at a given phase, or undefined. */
export function prevTransition(to: PhaseId): TDDTransition | undefined {
  return TDD_TRANSITIONS.find(t => t.to === to)
}

/**
 * Advance from the given phase in the cycle: red → green → refactor → red.
 * Returns the next PhaseId.
 */
export function nextPhase(current: PhaseId): PhaseId {
  const t = nextTransition(current)
  return t?.to ?? current
}

/**
 * Retreat to the previous phase in the cycle: red → refactor → green → red.
 * Returns the previous PhaseId.
 */
export function prevPhase(current: PhaseId): PhaseId {
  const t = prevTransition(current)
  return t?.from ?? current
}

/**
 * Return the ordered cycle as an array starting from the given phase.
 * e.g. cycleFrom('green') → ['green', 'refactor', 'red']
 */
export function cycleFrom(start: PhaseId): readonly PhaseId[] {
  const order: PhaseId[] = ['red', 'green', 'refactor']
  const startIndex = order.indexOf(start)
  if (startIndex === -1) return order
  return [...order.slice(startIndex), ...order.slice(0, startIndex)]
}

/**
 * Return a normalised (0–100) integer score representing how much of
 * a phase's work can be delegated to an AI agent.
 */
export function agentLoadPercent(id: PhaseId): number {
  const phase = findPhase(id)
  if (phase === undefined) return 0
  return Math.round(phase.agentRole.agentLoad * 100)
}
