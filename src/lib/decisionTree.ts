/**
 * decisionTree.ts — pure, deterministic Q&A decision tree.
 *
 * Models the "should I use a subagent / workflow / hook / skill / MCP / plain
 * prompt / output style?" decision for Claude Code practitioners.
 *
 * No side effects, no I/O, no randomness. All transitions are deterministic
 * given the same sequence of answers.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecommendationId =
  | 'use-subagent'
  | 'use-workflow'
  | 'use-hook'
  | 'use-skill'
  | 'use-mcp'
  | 'use-plain-prompt'
  | 'use-output-style'

export interface Choice {
  /** Short label shown on the button (≤ 60 chars). */
  label: string
  /** Optional tooltip / extra context shown on hover. */
  hint?: string
  /** ID of the next node to navigate to. */
  nextId: string
}

export interface QuestionNode {
  kind: 'question'
  id: string
  /** Question text shown to the user. */
  question: string
  /** Sub-text / clarifying note (optional). */
  subtext?: string
  choices: Choice[]
}

export interface RecommendationNode {
  kind: 'recommendation'
  id: RecommendationId
  /** Short title. */
  title: string
  /** Markdown-safe explanatory body (1–3 sentences). */
  body: string
  /** Concrete "how to start" hint. */
  howTo: string
  /**
   * Semantic category drives the badge colour.
   * Maps to token utility names used in the component.
   */
  category: 'agent' | 'automation' | 'hook' | 'skill' | 'tool' | 'prompt' | 'style'
}

export type TreeNode = QuestionNode | RecommendationNode

/** The full decision tree — every node keyed by its id. */
export type TreeMap = Record<string, TreeNode>

// ---------------------------------------------------------------------------
// Session state (immutable updates via `answer`)
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  nodeId: string
  chosenNextId: string
}

export interface TreeState {
  /** ID of the node the user is currently viewing. */
  currentId: string
  /** Ordered list of (node, choice) pairs already answered. */
  history: HistoryEntry[]
}

// ---------------------------------------------------------------------------
// The tree
// ---------------------------------------------------------------------------

export const ROOT_NODE_ID = 'root'

/**
 * Decision tree for "which Claude Code mechanism should I reach for?"
 *
 * Questions branch on the real decision axes extracted from the research:
 *   1. Task scope (one-shot vs recurring vs reactive)
 *   2. Context isolation needed?
 *   3. Parallelism / scale?
 *   4. External tool / data source?
 *   5. Behaviour customisation vs procedural instruction?
 *   6. Style / verbosity preference?
 */
export const TREE: TreeMap = {
  // ── Root ──────────────────────────────────────────────────────────────────
  root: {
    kind: 'question',
    id: 'root',
    question: 'What are you trying to accomplish?',
    subtext: 'Pick the description that fits best.',
    choices: [
      { label: 'Automate a multi-step task or workflow', nextId: 'q-multi-step' },
      { label: 'React to an event (file change, tool use, session start…)', nextId: 'q-event-driven' },
      { label: 'Give Claude a reusable procedure or playbook', nextId: 'q-reusable-proc' },
      { label: 'Connect Claude to an external tool, API, or data source', nextId: 'use-mcp' },
      { label: 'Adjust how Claude writes or speaks (tone/style/verbosity)', nextId: 'use-output-style' },
      { label: 'Just send a one-off prompt — no tooling needed', nextId: 'use-plain-prompt' },
    ],
  },

  // ── Multi-step branch ─────────────────────────────────────────────────────
  q_multi_step: {
    kind: 'question',
    id: 'q-multi-step',
    question: 'Does this task need to run at scale (many items in parallel) or on a schedule?',
    choices: [
      { label: 'Yes — many parallel agents or scheduled/recurring runs', nextId: 'use-workflow', hint: 'e.g. process 50 PRs, nightly report' },
      { label: 'No — one focused agent working through a task end-to-end', nextId: 'q-context-isolation' },
    ],
  },

  q_context_isolation: {
    kind: 'question',
    id: 'q-context-isolation',
    question: 'Does this agent need an isolated git worktree (to edit files without affecting main)?',
    subtext: 'Agents writing code in parallel always need isolation.',
    choices: [
      { label: 'Yes — isolated worktree / separate context window', nextId: 'use-subagent', hint: 'Custom subagent with isolation: worktree' },
      { label: 'No — runs in the current session context', nextId: 'q-reusable-proc' },
    ],
  },

  // ── Event-driven branch ───────────────────────────────────────────────────
  q_event_driven: {
    kind: 'question',
    id: 'q-event-driven',
    question: 'Which kind of event do you want to react to?',
    choices: [
      { label: 'A Claude Code lifecycle event (tool use, session, prompt, compact…)', nextId: 'use-hook' },
      { label: 'A time-based schedule (cron, loop, recurring task)', nextId: 'use-workflow' },
      { label: 'Incoming data from an external system (webhook, API push)', nextId: 'use-mcp' },
    ],
  },

  // ── Reusable procedure branch ─────────────────────────────────────────────
  q_reusable_proc: {
    kind: 'question',
    id: 'q-reusable-proc',
    question: 'Should this procedure load on every request, or only when explicitly invoked?',
    subtext: 'CLAUDE.md loads always; skills load lazily (on-demand).',
    choices: [
      { label: 'Lazy — only when I type /my-skill or Claude detects it matches', nextId: 'q-skill-scope' },
      { label: 'Always — project-wide standing instructions', nextId: 'use-plain-prompt', hint: 'Put it in CLAUDE.md' },
    ],
  },

  q_skill_scope: {
    kind: 'question',
    id: 'q-skill-scope',
    question: 'Does the skill need to run its own agent (subagent execution)?',
    subtext: 'Use context: fork for agent-level isolation inside a skill.',
    choices: [
      { label: 'Yes — the skill should spawn a subagent to do the work', nextId: 'use-subagent', hint: 'Skill with context: fork frontmatter' },
      { label: 'No — it is a procedure/playbook Claude follows directly', nextId: 'use-skill' },
    ],
  },

  // ── Recommendation leaves ─────────────────────────────────────────────────

  'use-subagent': {
    kind: 'recommendation',
    id: 'use-subagent',
    title: 'Subagent',
    body:
      'Subagents give each task its own isolated context window (and optionally a dedicated git worktree). ' +
      'They keep intermediate tool outputs out of your main session, prevent context bloat, and enable true ' +
      'parallel execution across independent lanes.',
    howTo:
      'Create `.claude/agents/<name>.md` with YAML frontmatter (model, tools, isolation: worktree). ' +
      'Invoke via the `Agent` tool or the /agents library. Use `context: fork` in a skill to combine both primitives.',
    category: 'agent',
  },

  'use-workflow': {
    kind: 'recommendation',
    id: 'use-workflow',
    title: 'Dynamic Workflow',
    body:
      'Workflows move orchestration into a JavaScript script rather than Claude\'s context window. ' +
      'Up to 16 concurrent subagents, 1 000 agents total per run, and scheduling support — ideal for ' +
      'nightly jobs, large-scale batch processing, or any task where you need programmatic coordination logic.',
    howTo:
      'Describe the task and include the word "ultracode" (or set /effort ultracode) — Claude writes the ' +
      'workflow script for you. Save it to `.claude/workflows/<name>.js` to get a slash command. ' +
      'Run /workflows to monitor progress.',
    category: 'automation',
  },

  'use-hook': {
    kind: 'recommendation',
    id: 'use-hook',
    title: 'Hook',
    body:
      'Hooks let you inject behaviour at 30 named lifecycle events — before/after tool use, on session start, ' +
      'on prompt submit, and more. Shell command hooks can block tool calls (exit 2) or inject context ' +
      '(stdout JSON). SDK hooks run as callbacks in your application process.',
    howTo:
      'Add a `hooks` block to `.claude/settings.json`. Use `PreToolUse` + `matcher: "Bash"` to audit ' +
      'commands, `PostToolUse` to post-process output, `SessionStart` to inject environment context. ' +
      'Exit 2 blocks the event; exit 0 + JSON modifies it.',
    category: 'hook',
  },

  'use-skill': {
    kind: 'recommendation',
    id: 'use-skill',
    title: 'Skill',
    body:
      'Skills are lazy-loaded Markdown playbooks that only consume tokens when invoked. ' +
      'They support dynamic context injection (! bash commands in SKILL.md), tool allowlists, ' +
      'model overrides, and the Agent Skills open standard — they work in other AI tools too.',
    howTo:
      'Create `.claude/skills/<name>/SKILL.md` with YAML frontmatter. ' +
      'Invoke via /<name> or let Claude auto-invoke when it detects a match. ' +
      'Use `allowed-tools`, `model`, and `argument-hint` to tune behaviour.',
    category: 'skill',
  },

  'use-mcp': {
    kind: 'recommendation',
    id: 'use-mcp',
    title: 'MCP Server',
    body:
      'MCP (Model Context Protocol) servers expose external tools and resources to Claude as first-class ' +
      'tool calls. Deferred loading via `ToolSearch` keeps context lean — schemas only load when needed. ' +
      'Use permission rules (`mcp__<server>__<action>`) to control access.',
    howTo:
      'Configure your server in `.mcp.json` or `settings.json → mcpServers`. ' +
      'Set `enableAllProjectMcpServers: true` to auto-approve project servers, or add individual approvals. ' +
      'Reference tools in hooks as `mcp__<server>__<action>` patterns.',
    category: 'tool',
  },

  'use-plain-prompt': {
    kind: 'recommendation',
    id: 'use-plain-prompt',
    title: 'Plain Prompt / CLAUDE.md',
    body:
      'For standing project instructions or one-off tasks, a well-crafted prompt or CLAUDE.md entry is ' +
      'often the simplest and most maintainable choice. CLAUDE.md content is injected into every session ' +
      'and prompt-cached automatically after the first request.',
    howTo:
      'Write your instructions in `CLAUDE.md` at the project root (or `~/.claude/CLAUDE.md` for personal ' +
      'instructions). Keep it focused — verbose CLAUDE.md files consume tokens on every request. ' +
      'For procedures only used occasionally, prefer a Skill instead.',
    category: 'prompt',
  },

  'use-output-style': {
    kind: 'recommendation',
    id: 'use-output-style',
    title: 'Output Style',
    body:
      'Output styles customise Claude\'s system prompt — changing how it writes, not what it does. ' +
      'Built-ins: Default, Proactive (acts immediately), Explanatory (adds Insights), Learning (adds TODO markers). ' +
      'Custom styles live in `.claude/output-styles/<name>.md` and activate via /config.',
    howTo:
      'Pick a built-in via `/config → Output style`, or create `.claude/output-styles/<name>.md`. ' +
      'Set `keep-coding-instructions: true` to layer your style on top of the built-in engineering prompt. ' +
      'Use `force-for-plugin: true` to auto-apply when a plugin is active.',
    category: 'style',
  },
}

// Alias the hyphenated ids to match the TREE keys (TypeScript safe — no `as`)
// The TREE object literal above uses quoted keys exactly matching the exported
// RecommendationId union and the q_* question ids.  We patch in the question
// node ids that use hyphens since object literal shorthand can't have hyphens.
;(TREE as Record<string, TreeNode>)['q-multi-step'] = {
  ...(TREE['q_multi_step'] as QuestionNode),
  id: 'q-multi-step',
}
;(TREE as Record<string, TreeNode>)['q-context-isolation'] = {
  ...(TREE['q_context_isolation'] as QuestionNode),
  id: 'q-context-isolation',
}
;(TREE as Record<string, TreeNode>)['q-event-driven'] = {
  ...(TREE['q_event_driven'] as QuestionNode),
  id: 'q-event-driven',
}
;(TREE as Record<string, TreeNode>)['q-reusable-proc'] = {
  ...(TREE['q_reusable_proc'] as QuestionNode),
  id: 'q-reusable-proc',
}
;(TREE as Record<string, TreeNode>)['q-skill-scope'] = {
  ...(TREE['q_skill_scope'] as QuestionNode),
  id: 'q-skill-scope',
}

// Remove the underscore-aliased duplicates so integrity tests pass
delete (TREE as Record<string, TreeNode | undefined>)['q_multi_step']
delete (TREE as Record<string, TreeNode | undefined>)['q_context_isolation']
delete (TREE as Record<string, TreeNode | undefined>)['q_event_driven']
delete (TREE as Record<string, TreeNode | undefined>)['q_reusable_proc']
delete (TREE as Record<string, TreeNode | undefined>)['q_skill_scope']

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/**
 * Look up a node by id. Returns `undefined` if not found.
 * Typed as `TreeNode | undefined` so callers must guard — no `!` needed.
 */
export function getNode(id: string): TreeNode | undefined {
  return (TREE as Record<string, TreeNode | undefined>)[id]
}

/**
 * Immutably advance state by recording the current node in history and
 * moving `currentId` to `nextId`.
 */
export function answer(state: TreeState, nextId: string): TreeState {
  return {
    currentId: nextId,
    history: [
      ...state.history,
      { nodeId: state.currentId, chosenNextId: nextId },
    ],
  }
}

/**
 * Return the recommendation for the current node, or `undefined` if the
 * current node is still a question.
 */
export function getRecommendation(state: TreeState): RecommendationNode | undefined {
  const node = getNode(state.currentId)
  if (node === undefined || node.kind !== 'recommendation') return undefined
  return node
}

/**
 * Return the initial (reset) tree state — always starts at the root question.
 */
export function resetState(): TreeState {
  return { currentId: ROOT_NODE_ID, history: [] }
}
