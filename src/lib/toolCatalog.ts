/**
 * Tool catalog — pure, deterministic data + filter logic.
 * Sourced from research packet A (packet-A-claude-code.md, section 2).
 */

export type ToolSurface =
  | 'filesystem'
  | 'shell'
  | 'search'
  | 'web'
  | 'agents'
  | 'tasks'
  | 'mcp'
  | 'scheduling'
  | 'notifications'
  | 'notebook'
  | 'intelligence'
  | 'platform'

export interface ToolEntry {
  name: string
  surface: ToolSurface
  what: string
  when: string
  example: string
  gotcha: string
  permissionRequired: boolean
}

export const TOOL_CATALOG: ToolEntry[] = [
  // ── Filesystem ──────────────────────────────────────────────────────────────
  {
    name: 'Read',
    surface: 'filesystem',
    what: 'Read file contents with line numbers; handles images, PDFs, and Jupyter notebooks.',
    when: 'Before editing any file, or to inspect source code, configs, and binary assets.',
    example: 'Read("/src/index.ts") — returns contents with line numbers starting at 1.',
    gotcha: 'Must be called before Edit or Write on an existing file; piped Bash output does NOT satisfy this requirement.',
    permissionRequired: false,
  },
  {
    name: 'Edit',
    surface: 'filesystem',
    what: 'Exact string replacement in files. Supports replace_all for renaming across a file.',
    when: 'Modifying an existing file after reading it; prefer over Write for partial changes.',
    example: 'Edit with old_string + new_string; fails if old_string appears more than once (use replace_all).',
    gotcha: 'old_string must be unique in the file unless replace_all: true. The file must not have changed on disk since the last Read.',
    permissionRequired: true,
  },
  {
    name: 'Write',
    surface: 'filesystem',
    what: 'Create or completely overwrite a file. For partial changes, prefer Edit.',
    when: 'Creating new files or doing a full rewrite where Edit would be unwieldy.',
    example: 'Write("/src/newModule.ts", content) — overwrites if file exists (requires prior Read).',
    gotcha: 'If the file already exists you MUST Read it first; Write does not diff — it replaces the entire content.',
    permissionRequired: true,
  },
  {
    name: 'Glob',
    surface: 'filesystem',
    what: 'Find files by glob pattern (supports **). Results sorted by mtime, capped at 100.',
    when: 'Discovering files when you know the pattern but not the exact path.',
    example: 'Glob("src/**/*.test.ts") — returns up to 100 matches sorted by modification time.',
    gotcha: 'Does NOT respect .gitignore by default (unlike Grep). Set CLAUDE_CODE_GLOB_NO_IGNORE=false to enable.',
    permissionRequired: false,
  },
  {
    name: 'Grep',
    surface: 'search',
    what: 'Search file contents via ripgrep regex; modes: files_with_matches (default), content, count.',
    when: 'Finding all files that contain a pattern, or counting occurrences across a codebase.',
    example: 'Grep("TODO", mode: "files_with_matches") — lists files containing "TODO".',
    gotcha: 'Respects .gitignore by default (unlike Glob). Regex is ripgrep flavor, not JS RegExp.',
    permissionRequired: false,
  },

  // ── Shell ────────────────────────────────────────────────────────────────────
  {
    name: 'Bash',
    surface: 'shell',
    what: 'Execute shell commands. Default 2-minute timeout; output capped at 30K chars.',
    when: 'Running builds, tests, CLI tools, git commands, or any system operation.',
    example: 'Bash("npm run build", timeout: 120000) — runs build with explicit 2-min cap.',
    gotcha: 'Environment variables do NOT persist across separate Bash calls. cd persists only within the project directory.',
    permissionRequired: true,
  },
  {
    name: 'Monitor',
    surface: 'shell',
    what: 'Run a command in the background and stream each output line back to Claude in real time.',
    when: 'Watching CI logs, dev-server stdout, or file watchers that produce events over time.',
    example: 'Monitor("npm run dev") — feeds each log line back so Claude can react as tests pass/fail.',
    gotcha: 'Not available on Bedrock, Vertex AI, or Foundry. Also disabled when CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC is set.',
    permissionRequired: true,
  },
  {
    name: 'PowerShell',
    surface: 'shell',
    what: 'Execute PowerShell commands natively (opt-in; automatic on Windows without Git Bash).',
    when: 'Windows-specific system tasks or when Git Bash is unavailable.',
    example: 'Set CLAUDE_CODE_USE_POWERSHELL_TOOL=1 on Linux/macOS to opt in explicitly.',
    gotcha: 'Sandboxed Bash is not available on Windows; PowerShell is the only shell tool there.',
    permissionRequired: true,
  },

  // ── Search / Intelligence ───────────────────────────────────────────────────
  {
    name: 'LSP',
    surface: 'intelligence',
    what: 'Code intelligence via language servers: jump to definition, find references, type errors, call hierarchy.',
    when: 'Navigating large codebases, finding all usages of a symbol, or catching type errors without a build step.',
    example: 'LSP("findReferences", "MyClass") — returns every file and line that references MyClass.',
    gotcha: 'Requires the code intelligence plugin to be installed AND the language server binary present separately.',
    permissionRequired: false,
  },

  // ── Web ──────────────────────────────────────────────────────────────────────
  {
    name: 'WebFetch',
    surface: 'web',
    what: 'Fetch a URL, convert HTML to Markdown, run an extraction prompt via a small model. 15-minute cache.',
    when: 'Reading documentation pages, API references, or any external URL for its text content.',
    example: 'WebFetch("https://example.com/docs") — returns an AI-extracted summary of the page.',
    gotcha: 'Lossy by design — you get the extraction model\'s summary, not raw HTML. Cross-host redirects are NOT followed automatically.',
    permissionRequired: true,
  },
  {
    name: 'WebSearch',
    surface: 'web',
    what: 'Query Anthropic\'s web search backend; returns titles + URLs only (up to 8 backend searches per call).',
    when: 'Finding relevant pages before using WebFetch, or getting an overview of search results.',
    example: 'WebSearch("Claude Code hooks reference") — returns ranked URLs to then fetch individually.',
    gotcha: 'Returns titles/URLs only — not page content. Use WebFetch to read pages. Not available on Amazon Bedrock.',
    permissionRequired: true,
  },

  // ── Agents ───────────────────────────────────────────────────────────────────
  {
    name: 'Agent',
    surface: 'agents',
    what: 'Spawn a named subagent or fork the current conversation into a background agent.',
    when: 'Parallelising work across multiple agents, or delegating a self-contained sub-task.',
    example: 'Agent("Explore", prompt: "find all API endpoints") — uses the lightweight read-only Explore agent.',
    gotcha: 'Only the final summary returns to the parent — intermediate tool outputs are not visible in parent context.',
    permissionRequired: false,
  },
  {
    name: 'Workflow',
    surface: 'agents',
    what: 'Run a dynamic JavaScript workflow script that orchestrates up to 1,000 subagents at scale.',
    when: 'Massive parallelism tasks (e.g. lint+fix every file, run 50 code-review agents) that would blow the context window.',
    example: 'Trigger with the keyword "ultracode" in your prompt or set /effort ultracode for the session.',
    gotcha: 'No mid-run user input except permission prompts. Intermediate results stay in script variables, not Claude context.',
    permissionRequired: true,
  },
  {
    name: 'Skill',
    surface: 'platform',
    what: 'Execute a named skill (SKILL.md) within the main conversation.',
    when: 'Invoking a project or personal skill that loads lazily — keeps CLAUDE.md lean.',
    example: '/code-review — invokes the bundled code-review skill; or /my-skill for custom ones.',
    gotcha: 'Skills are auto-triggered when Claude deems the task matches the skill description unless disable-model-invocation: true is set in frontmatter.',
    permissionRequired: true,
  },

  // ── Tasks ────────────────────────────────────────────────────────────────────
  {
    name: 'TaskCreate',
    surface: 'tasks',
    what: 'Create a task in the session task list (replaced TodoWrite since v2.1.142).',
    when: 'Breaking a multi-step goal into trackable checklist items at the start of a task.',
    example: 'TaskCreate({title: "Write tests", dependencies: []}) — adds to the session task list.',
    gotcha: 'TodoWrite is disabled by default since v2.1.142. Set CLAUDE_CODE_ENABLE_TASKS=0 to re-enable legacy TodoWrite.',
    permissionRequired: false,
  },
  {
    name: 'TaskUpdate',
    surface: 'tasks',
    what: 'Update task status, dependencies, or delete a task from the session task list.',
    when: 'Marking tasks complete, adding blockers, or removing tasks that became irrelevant.',
    example: 'TaskUpdate({id: "t1", status: "done"}) — marks task complete.',
    gotcha: 'Task state is session-scoped — it resets on /clear or when the session ends.',
    permissionRequired: false,
  },
  {
    name: 'TaskList',
    surface: 'tasks',
    what: 'List all tasks with their current status.',
    when: 'Checking overall progress before deciding which step to tackle next.',
    example: 'TaskList() — returns all tasks with status: pending, in_progress, done, blocked.',
    gotcha: 'Use /tasks slash command for an interactive UI view; TaskList is the programmatic equivalent.',
    permissionRequired: false,
  },
  {
    name: 'TaskGet',
    surface: 'tasks',
    what: 'Get full details for a specific task by ID.',
    when: 'Inspecting a single task\'s description, dependencies, or output path.',
    example: 'TaskGet({id: "t1"}) — returns full task object including any output path.',
    gotcha: 'TaskOutput (deprecated) was the old way to retrieve task output; prefer Read on the output path instead.',
    permissionRequired: false,
  },
  {
    name: 'TaskStop',
    surface: 'tasks',
    what: 'Kill a running background task by ID.',
    when: 'Stopping a runaway background agent or aborting a Monitor that is no longer needed.',
    example: 'TaskStop({id: "t2"}) — terminates the running background task immediately.',
    gotcha: 'Has no undo — the task cannot be resumed after a stop. Re-create it if needed.',
    permissionRequired: false,
  },

  // ── Scheduling ───────────────────────────────────────────────────────────────
  {
    name: 'CronCreate',
    surface: 'scheduling',
    what: 'Schedule a recurring or one-shot prompt for the current session.',
    when: 'Polling for status changes, retrying a job, or running a check on an interval.',
    example: 'CronCreate({interval: "5m", prompt: "check if tests pass"}) — runs every 5 minutes.',
    gotcha: 'Cron tasks are session-scoped; they stop when the session ends. Use RemoteTrigger for persistent schedules.',
    permissionRequired: false,
  },
  {
    name: 'CronDelete',
    surface: 'scheduling',
    what: 'Cancel a scheduled task by ID.',
    when: 'Stopping a session cron after its goal is achieved.',
    example: 'CronDelete({id: "cron_abc"}) — cancels the recurring prompt.',
    gotcha: 'CronList first if you don\'t remember the ID.',
    permissionRequired: false,
  },
  {
    name: 'CronList',
    surface: 'scheduling',
    what: 'List all session-scheduled cron tasks.',
    when: 'Auditing what recurring prompts are active in the session.',
    example: 'CronList() — returns IDs, intervals, and prompt text for each active cron.',
    gotcha: 'Lists only session-scoped crons; RemoteTrigger routines are managed separately via claude.ai.',
    permissionRequired: false,
  },
  {
    name: 'RemoteTrigger',
    surface: 'scheduling',
    what: 'Create, run, or list Routines (persistent cloud agents) on claude.ai.',
    when: 'Setting up scheduled agents that persist beyond a single CLI session.',
    example: 'RemoteTrigger({action: "create", routine: {prompt: "...", schedule: "0 9 * * *"}}).',
    gotcha: 'Requires Pro/Max/Team/Enterprise plan. Session-scoped crons (CronCreate) do not need this.',
    permissionRequired: false,
  },

  // ── Notifications ────────────────────────────────────────────────────────────
  {
    name: 'PushNotification',
    surface: 'notifications',
    what: 'Send a desktop and phone push notification via Anthropic-hosted infrastructure.',
    when: 'Alerting the user when a long-running background task completes or needs input.',
    example: 'PushNotification({title: "Build done", body: "Tests passed"}) — fires desktop + mobile push.',
    gotcha: 'Only works on Anthropic-hosted infra (claude.ai). Requires agentPushNotifEnabled: true in settings.',
    permissionRequired: false,
  },

  // ── Notebook ─────────────────────────────────────────────────────────────────
  {
    name: 'NotebookEdit',
    surface: 'notebook',
    what: 'Modify Jupyter notebook cells by cell_id: replace, insert, or delete cells.',
    when: 'Updating a .ipynb notebook\'s code or markdown cells programmatically.',
    example: 'NotebookEdit({cell_id: "abc", action: "replace", source: "print(\'hello\')"}).',
    gotcha: 'Requires prior Read of the notebook. Read returns all cells with outputs — inspect before editing.',
    permissionRequired: true,
  },

  // ── MCP ──────────────────────────────────────────────────────────────────────
  {
    name: 'ToolSearch',
    surface: 'mcp',
    what: 'Dynamically find and load deferred MCP tool schemas on demand.',
    when: 'When an MCP tool is listed in the system-reminder but its schema is not yet loaded.',
    example: 'ToolSearch("select:mcp__memory__create_entities,mcp__memory__search") — loads both schemas.',
    gotcha: 'On Vertex AI or a custom ANTHROPIC_BASE_URL, ToolSearch is disabled and all MCP schemas load upfront.',
    permissionRequired: false,
  },
  {
    name: 'ListMcpResourcesTool',
    surface: 'mcp',
    what: 'List resources exposed by connected MCP servers.',
    when: 'Discovering what resources (files, data, configs) an MCP server has made available.',
    example: 'ListMcpResourcesTool() — returns resource URIs and descriptions from all connected servers.',
    gotcha: 'Only lists resources; use ReadMcpResourceTool to actually read a resource\'s content.',
    permissionRequired: false,
  },
  {
    name: 'ReadMcpResourceTool',
    surface: 'mcp',
    what: 'Read a specific MCP resource by URI.',
    when: 'Fetching the content of a resource a server has exposed (e.g. a shared schema, config, or dataset).',
    example: 'ReadMcpResourceTool({uri: "memory://entities"}) — returns the resource content.',
    gotcha: 'Resource URIs come from ListMcpResourcesTool; guessing URIs is unreliable.',
    permissionRequired: false,
  },
  {
    name: 'WaitForMcpServers',
    surface: 'mcp',
    what: 'Wait for connecting MCP servers when tool search is disabled.',
    when: 'Required only when running on Vertex AI or a custom base URL where deferred tool loading is disabled.',
    example: 'WaitForMcpServers() — blocks until all declared MCP servers are connected.',
    gotcha: 'Unnecessary when ToolSearch is available (default on claude.ai). Introduced as a companion to TodoWrite min-version marker in v2.1.142.',
    permissionRequired: false,
  },

  // ── Platform / Misc ──────────────────────────────────────────────────────────
  {
    name: 'AskUserQuestion',
    surface: 'platform',
    what: 'Present multiple-choice clarification questions to the user mid-session.',
    when: 'Ambiguity must be resolved before proceeding (e.g. which branch to base on).',
    example: 'AskUserQuestion({question: "Which env?", choices: ["dev", "prod"]}).',
    gotcha: 'Blocks the agent loop until the user responds; use sparingly in automated pipelines.',
    permissionRequired: false,
  },
  {
    name: 'Artifact',
    surface: 'platform',
    what: 'Publish HTML or Markdown as an org-shared page on claude.ai.',
    when: 'Sharing a generated report, visualization, or doc with teammates via a persistent URL.',
    example: 'Artifact({content: "<h1>Report</h1>...", type: "html"}) — returns a shareable link.',
    gotcha: 'Only available on claude.ai; disabled in CLI-only environments. Requires Artifact permission approval.',
    permissionRequired: true,
  },
  {
    name: 'ShareOnboardingGuide',
    surface: 'platform',
    what: 'Upload ONBOARDING.md and return a shareable link for new team members.',
    when: 'Distributing a project\'s onboarding guide externally without granting repo access.',
    example: 'ShareOnboardingGuide() — uploads ONBOARDING.md from the project root and returns a URL.',
    gotcha: 'Looks for ONBOARDING.md at the project root; the file must exist before calling.',
    permissionRequired: true,
  },
  {
    name: 'EnterWorktree',
    surface: 'platform',
    what: 'Create or enter an isolated git worktree for the current session.',
    when: 'Working on a feature branch in isolation without disturbing the main checkout.',
    example: 'EnterWorktree({branch: "feat/new-api"}) — checks out the branch in a fresh worktree.',
    gotcha: 'Pair with ExitWorktree when done; abandoned worktrees accumulate disk usage.',
    permissionRequired: false,
  },
  {
    name: 'ExitWorktree',
    surface: 'platform',
    what: 'Exit the current worktree and return to the original working directory.',
    when: 'After completing work in an isolated worktree and returning to main context.',
    example: 'ExitWorktree() — returns to the directory active before EnterWorktree was called.',
    gotcha: 'Does not delete the worktree; use git worktree remove manually to clean up.',
    permissionRequired: false,
  },
  {
    name: 'SendMessage',
    surface: 'agents',
    what: 'Send a message to an agent teammate or resume a subagent (experimental).',
    when: 'Coordinating between agent team members in a multi-agent setup.',
    example: 'SendMessage({to: "Reviewer", content: "PR is ready for review"}).',
    gotcha: 'Experimental — API shape may change. Only useful when running agent teams via /agents.',
    permissionRequired: false,
  },
]

export type SortKey = 'name' | 'surface'

export interface FilterParams {
  query: string
  surface: ToolSurface | 'all'
  permissionRequired: boolean | null
}

/** Normalise a string for case-insensitive substring search. */
function normalise(s: string): string {
  return s.toLowerCase()
}

/**
 * Filter and sort the tool catalog.
 * Returns a new array — the original TOOL_CATALOG is never mutated.
 */
export function filterTools(
  catalog: ToolEntry[],
  params: FilterParams,
  sortKey: SortKey = 'name',
): ToolEntry[] {
  const q = normalise(params.query.trim())

  const filtered = catalog.filter(tool => {
    // Surface filter
    if (params.surface !== 'all' && tool.surface !== params.surface) return false

    // Permission filter
    if (params.permissionRequired !== null && tool.permissionRequired !== params.permissionRequired) {
      return false
    }

    // Text search across name, what, when, example, gotcha
    if (q.length > 0) {
      const haystack = normalise(
        [tool.name, tool.what, tool.when, tool.example, tool.gotcha].join(' '),
      )
      if (!haystack.includes(q)) return false
    }

    return true
  })

  return [...filtered].sort((a, b) => {
    if (sortKey === 'surface') {
      const cmp = a.surface.localeCompare(b.surface)
      return cmp !== 0 ? cmp : a.name.localeCompare(b.name)
    }
    return a.name.localeCompare(b.name)
  })
}

/** All unique surfaces present in a catalog slice. */
export function availableSurfaces(catalog: ToolEntry[]): ToolSurface[] {
  const seen = new Set<ToolSurface>()
  for (const tool of catalog) seen.add(tool.surface)
  return [...seen].sort()
}
