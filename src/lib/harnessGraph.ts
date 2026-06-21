/**
 * harnessGraph.ts — pure, deterministic data for the HarnessExplorer widget.
 *
 * Models the Claude Code agent loop as a directed graph of nodes (phases) and
 * edges (transitions). All data is static and has no side-effects; safe to
 * import in server or client components.
 */

export type NodeId =
  | 'context'
  | 'model'
  | 'tool-call'
  | 'tool-result'
  | 'loop-check'
  | 'result'

export interface HarnessNode {
  readonly id: NodeId
  /** Short display label shown inside the diagram node */
  readonly label: string
  /** One-sentence role in the loop (shown in the info panel) */
  readonly summary: string
  /** Rich explanation revealed on click */
  readonly description: string
  /** Semantic colour role — maps to a token class */
  readonly role: 'surface' | 'accent' | 'tip' | 'warning' | 'note'
}

export interface HarnessEdge {
  readonly from: NodeId
  readonly to: NodeId
  /** Short label rendered on the arrow */
  readonly label: string
  /** Whether this edge closes the loop (used for visual styling) */
  readonly isLoop: boolean
}

export interface HarnessGraph {
  readonly nodes: readonly HarnessNode[]
  readonly edges: readonly HarnessEdge[]
}

// ---------------------------------------------------------------------------
// Node definitions — content grounded in packet-A-claude-code.md §1 (Agent Loop)
// ---------------------------------------------------------------------------

export const HARNESS_NODES: readonly HarnessNode[] = [
  {
    id: 'context',
    label: 'Context Window',
    summary: 'The append-only message array that holds the full conversation history.',
    description:
      'The context window is the agent loop\'s single source of truth. It starts with ' +
      'a system prompt, then grows turn-by-turn: user messages, assistant messages, tool ' +
      'calls, and tool results are all appended — never overwritten. Static parts ' +
      '(system prompt, tool definitions, CLAUDE.md) are automatically prompt-cached ' +
      'after the first request, keeping repeated-request costs low. When the window ' +
      'approaches its limit, auto-compaction summarises older history and emits a ' +
      'compact_boundary system message.',
    role: 'surface',
  },
  {
    id: 'model',
    label: 'Model Inference',
    summary: 'Claude reads the context and produces either tool calls or a final text response.',
    description:
      'At each turn, the full context window is sent to the Claude model. The model ' +
      'outputs either one or more tool-use blocks (requesting tool calls) or a plain-text ' +
      'response. The depth of reasoning per turn is controlled by the effort level: ' +
      'low | medium | high | xhigh | max. Higher effort consumes more thinking tokens but ' +
      'yields better results for complex tasks. Extended Thinking (visible chain-of-thought ' +
      'blocks) can be combined with effort independently.',
    role: 'accent',
  },
  {
    id: 'tool-call',
    label: 'Tool Dispatch',
    summary: 'Requested tools are dispatched — read-only tools run in parallel, write tools run sequentially.',
    description:
      'When the model output contains tool-use blocks, the harness dispatches them to ' +
      'the appropriate tool handlers. Read-only tools (Read, Glob, Grep, and MCP tools ' +
      'marked readOnlyHint) execute concurrently within a single turn. State-modifying ' +
      'tools (Edit, Write, Bash) always run sequentially. The harness enforces permission ' +
      'rules before each call: allow rules auto-approve; deny rules block; unmatched calls ' +
      'invoke the approval callback (or are denied if no callback exists). Six permission ' +
      'modes control the overall policy: default, acceptEdits, plan, dontAsk, auto, bypassPermissions.',
    role: 'warning',
  },
  {
    id: 'tool-result',
    label: 'Tool Results',
    summary: 'Each tool\'s output is collected and appended back into the context window.',
    description:
      'After tool execution, the results are wrapped in a UserMessage (tool_result role) ' +
      'and appended to the context. This is what gives the loop its iterative power: Claude ' +
      'sees the result of every action it requested before deciding what to do next. ' +
      'Tool outputs can be large — a single file read may cost thousands of tokens. ' +
      'PostToolUse hooks can rewrite tool output (updatedToolOutput) before Claude sees it, ' +
      'or inject additional context (additionalContext) alongside it.',
    role: 'tip',
  },
  {
    id: 'loop-check',
    label: 'Continue?',
    summary: 'The harness checks whether to run another turn or emit the final ResultMessage.',
    description:
      'After appending tool results, the harness evaluates three stopping conditions: ' +
      '(1) The last model response contained no tool calls — loop terminates naturally. ' +
      '(2) The turn count has reached maxTurns — emits ResultMessage with subtype ' +
      'error_max_turns. (3) Cumulative spend has reached maxBudgetUsd — emits ' +
      'error_max_budget_usd. If none apply, control passes back to the model for the ' +
      'next inference call. Stop hooks fire here and can inject additionalContext to ' +
      'continue, or decision: "block" to halt.',
    role: 'note',
  },
  {
    id: 'result',
    label: 'ResultMessage',
    summary: 'The loop ends and emits a ResultMessage with the final text, token usage, and cost.',
    description:
      'A ResultMessage is emitted once the loop terminates. It carries: the final text ' +
      'response, session ID, stop reason, cumulative input/output token counts, and total ' +
      'cost in USD. Subtypes: success (natural end), error_max_turns, error_max_budget_usd, ' +
      'error_during_execution, error_max_structured_output_retries. In the Agent SDK this ' +
      'is the final item yielded by query() (TypeScript) or the async generator (Python). ' +
      'In the CLI it becomes the visible final assistant message.',
    role: 'surface',
  },
]

// ---------------------------------------------------------------------------
// Edge definitions — directed transitions between phases
// ---------------------------------------------------------------------------

export const HARNESS_EDGES: readonly HarnessEdge[] = [
  { from: 'context',     to: 'model',       label: 'send context',     isLoop: false },
  { from: 'model',       to: 'tool-call',   label: 'tool requests',    isLoop: false },
  { from: 'model',       to: 'result',      label: 'no tools → done',  isLoop: false },
  { from: 'tool-call',   to: 'tool-result', label: 'outputs',          isLoop: false },
  { from: 'tool-result', to: 'loop-check',  label: 'append results',   isLoop: false },
  { from: 'loop-check',  to: 'context',     label: 'next turn',        isLoop: true  },
  { from: 'loop-check',  to: 'result',      label: 'limit reached',    isLoop: false },
]

// ---------------------------------------------------------------------------
// Composed graph export
// ---------------------------------------------------------------------------

export const HARNESS_GRAPH: HarnessGraph = {
  nodes: HARNESS_NODES,
  edges: HARNESS_EDGES,
}

// ---------------------------------------------------------------------------
// Pure query helpers
// ---------------------------------------------------------------------------

/** Return the node with a given id, or undefined if not found. */
export function findNode(id: NodeId): HarnessNode | undefined {
  return HARNESS_NODES.find(n => n.id === id)
}

/** Return all edges that originate from a given node. */
export function edgesFrom(id: NodeId): readonly HarnessEdge[] {
  return HARNESS_EDGES.filter(e => e.from === id)
}

/** Return all edges that point to a given node. */
export function edgesTo(id: NodeId): readonly HarnessEdge[] {
  return HARNESS_EDGES.filter(e => e.to === id)
}

/** Return all loop-back edges (those that form the iterative cycle). */
export function loopEdges(): readonly HarnessEdge[] {
  return HARNESS_EDGES.filter(e => e.isLoop)
}

/** Return true when a path from `from` reaches `to` within the directed graph. */
export function canReach(from: NodeId, to: NodeId): boolean {
  if (from === to) return true
  const visited = new Set<NodeId>()
  const queue: NodeId[] = [from]
  while (queue.length > 0) {
    const current = queue.shift()
    if (current === undefined) break
    if (visited.has(current)) continue
    visited.add(current)
    for (const edge of edgesFrom(current)) {
      if (edge.to === to) return true
      queue.push(edge.to)
    }
  }
  return false
}
