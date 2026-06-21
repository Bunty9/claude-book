/**
 * Ecosystem data and filter logic for the EcosystemExplorer widget.
 * All data sourced from research packet B (packet-B-ecosystem.md).
 * Pure / deterministic — no side effects, no I/O.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ItemType = 'plugin' | 'mcp-server' | 'skill' | 'repo'

export type UseCase =
  | 'code-intelligence'
  | 'source-control'
  | 'project-management'
  | 'design'
  | 'infrastructure'
  | 'communication'
  | 'security'
  | 'workflow'
  | 'output-style'
  | 'reference'
  | 'context-management'
  | 'database'
  | 'monitoring'
  | 'browser-automation'
  | 'agents'

export interface EcosystemItem {
  id: string
  name: string
  type: ItemType
  useCases: UseCase[]
  description: string
  installHint: string | null
  url: string
  isNew: boolean // "newest to try" flag from research packet §9
}

// ── Data ─────────────────────────────────────────────────────────────────────

export const ECOSYSTEM_ITEMS: EcosystemItem[] = [
  // ── Official Plugins ──────────────────────────────────────────────────────
  {
    id: 'plugin-security-guidance',
    name: 'security-guidance',
    type: 'plugin',
    useCases: ['security', 'workflow'],
    description:
      'Reviews every change Claude writes for common vulnerabilities and instructs Claude to fix them in-session. Released May 2026.',
    installHint: '/plugin install security-guidance@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: true,
  },
  {
    id: 'plugin-commit-commands',
    name: 'commit-commands',
    type: 'plugin',
    useCases: ['source-control', 'workflow'],
    description:
      'Git commit workflows: commit, push, and PR creation skills bundled as slash commands.',
    installHint: '/plugin install commit-commands@claude-plugins-official',
    url: 'https://github.com/anthropics/claude-plugins-official',
    isNew: false,
  },
  {
    id: 'plugin-pr-review-toolkit',
    name: 'pr-review-toolkit',
    type: 'plugin',
    useCases: ['source-control', 'workflow'],
    description: 'Specialized agents for reviewing pull requests with structured feedback.',
    installHint: '/plugin install pr-review-toolkit@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-feature-dev',
    name: 'feature-dev',
    type: 'plugin',
    useCases: ['workflow', 'agents'],
    description:
      '7-phase guided feature development workflow that orchestrates planning, implementation, and review.',
    installHint: '/plugin install feature-dev@claude-plugins-official',
    url: 'https://github.com/anthropics/claude-plugins-official/blob/main/plugins/feature-dev/README.md',
    isNew: false,
  },
  {
    id: 'plugin-agent-sdk-dev',
    name: 'agent-sdk-dev',
    type: 'plugin',
    useCases: ['agents', 'workflow'],
    description: 'Tools and skills for building with the Claude Agent SDK.',
    installHint: '/plugin install agent-sdk-dev@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-frontend-design',
    name: 'frontend-design',
    type: 'plugin',
    useCases: ['design', 'workflow'],
    description: 'Frontend design guidance with attention to detail — layout, spacing, and accessibility reviews.',
    installHint: '/plugin install frontend-design@claude-plugins-official',
    url: 'https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/README.md',
    isNew: false,
  },
  {
    id: 'plugin-claude-md-management',
    name: 'claude-md-management',
    type: 'plugin',
    useCases: ['workflow'],
    description:
      'Audits and maintains CLAUDE.md files, captures session learnings, and keeps project instructions in sync.',
    installHint: '/plugin install claude-md-management@claude-plugins-official',
    url: 'https://github.com/anthropics/claude-plugins-official/blob/main/plugins/claude-md-management/README.md',
    isNew: false,
  },
  {
    id: 'plugin-claude-code-setup',
    name: 'claude-code-setup',
    type: 'plugin',
    useCases: ['workflow'],
    description:
      'Analyzes a codebase and recommends tailored Claude Code automations, hooks, and settings.',
    installHint: '/plugin install claude-code-setup@claude-plugins-official',
    url: 'https://github.com/anthropics/claude-plugins-official/blob/main/plugins/claude-code-setup/README.md',
    isNew: false,
  },
  {
    id: 'plugin-plugin-dev',
    name: 'plugin-dev',
    type: 'plugin',
    useCases: ['workflow'],
    description: 'Toolkit for creating plugins — scaffolding, validation, and submission helpers.',
    installHint: '/plugin install plugin-dev@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-github',
    name: 'github',
    type: 'plugin',
    useCases: ['source-control'],
    description: 'Official GitHub MCP bundled as a plugin — repos, PRs, issues, and code search.',
    installHint: '/plugin install github@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-gitlab',
    name: 'gitlab',
    type: 'plugin',
    useCases: ['source-control'],
    description: 'Official GitLab MCP bundled as a plugin — MRs, issues, and pipelines.',
    installHint: '/plugin install gitlab@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-atlassian',
    name: 'atlassian',
    type: 'plugin',
    useCases: ['project-management'],
    description: 'Jira + Confluence integration bundled as a plugin. EMA-supported.',
    installHint: '/plugin install atlassian@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-linear',
    name: 'linear',
    type: 'plugin',
    useCases: ['project-management'],
    description: 'Linear issue tracking bundled as a plugin. EMA-supported.',
    installHint: '/plugin install linear@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-notion',
    name: 'notion',
    type: 'plugin',
    useCases: ['project-management'],
    description: 'Notion pages and databases integration bundled as a plugin.',
    installHint: '/plugin install notion@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-asana',
    name: 'asana',
    type: 'plugin',
    useCases: ['project-management'],
    description: 'Asana task management bundled as a plugin. EMA-supported.',
    installHint: '/plugin install asana@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-figma',
    name: 'figma',
    type: 'plugin',
    useCases: ['design'],
    description: 'Official Figma MCP bundled as a plugin — design file access and inspection. EMA-supported.',
    installHint: '/plugin install figma@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-vercel',
    name: 'vercel',
    type: 'plugin',
    useCases: ['infrastructure'],
    description: 'Vercel deploy, preview, and environment variable management bundled as a plugin.',
    installHint: '/plugin install vercel@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-firebase',
    name: 'firebase',
    type: 'plugin',
    useCases: ['infrastructure', 'database'],
    description: 'Firebase full deploy-platform integration bundled as a plugin.',
    installHint: '/plugin install firebase@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-supabase',
    name: 'supabase',
    type: 'plugin',
    useCases: ['infrastructure', 'database'],
    description: 'Supabase DB queries and edge functions integration. EMA-supported.',
    installHint: '/plugin install supabase@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-slack',
    name: 'slack',
    type: 'plugin',
    useCases: ['communication'],
    description: 'Official Slack MCP bundled as a plugin — channels, messages, and search.',
    installHint: '/plugin install slack@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-sentry',
    name: 'sentry',
    type: 'plugin',
    useCases: ['monitoring'],
    description: 'Sentry error tracking integration bundled as a plugin.',
    installHint: '/plugin install sentry@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-explanatory-output-style',
    name: 'explanatory-output-style',
    type: 'plugin',
    useCases: ['output-style'],
    description:
      'Educational output style — Claude includes insights about implementation choices and tradeoffs.',
    installHint: '/plugin install explanatory-output-style@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-learning-output-style',
    name: 'learning-output-style',
    type: 'plugin',
    useCases: ['output-style'],
    description: 'Interactive learning mode — Claude prompts the user to build skills rather than just handing answers.',
    installHint: '/plugin install learning-output-style@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  // LSP plugins
  {
    id: 'plugin-typescript-lsp',
    name: 'typescript-lsp',
    type: 'plugin',
    useCases: ['code-intelligence'],
    description: 'TypeScript / JavaScript language server integration. Requires `typescript-language-server` binary.',
    installHint: '/plugin install typescript-lsp@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-pyright-lsp',
    name: 'pyright-lsp',
    type: 'plugin',
    useCases: ['code-intelligence'],
    description: 'Python language server integration via Pyright. Requires `pyright-langserver` binary.',
    installHint: '/plugin install pyright-lsp@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-rust-analyzer-lsp',
    name: 'rust-analyzer-lsp',
    type: 'plugin',
    useCases: ['code-intelligence'],
    description: 'Rust language server integration via rust-analyzer. Requires `rust-analyzer` binary.',
    installHint: '/plugin install rust-analyzer-lsp@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  {
    id: 'plugin-gopls-lsp',
    name: 'gopls-lsp',
    type: 'plugin',
    useCases: ['code-intelligence'],
    description: 'Go language server integration via gopls. Requires `gopls` binary.',
    installHint: '/plugin install gopls-lsp@claude-plugins-official',
    url: 'https://code.claude.com/docs/en/discover-plugins',
    isNew: false,
  },
  // ── MCP Servers ───────────────────────────────────────────────────────────
  {
    id: 'mcp-filesystem',
    name: 'filesystem',
    type: 'mcp-server',
    useCases: ['reference'],
    description:
      'Official Anthropic reference server — secure file operations with configurable access controls.',
    installHint: null,
    url: 'https://github.com/modelcontextprotocol/servers',
    isNew: false,
  },
  {
    id: 'mcp-fetch',
    name: 'fetch',
    type: 'mcp-server',
    useCases: ['reference', 'context-management'],
    description:
      'Official Anthropic reference server — web content fetching and HTML→Markdown conversion.',
    installHint: null,
    url: 'https://github.com/modelcontextprotocol/servers',
    isNew: false,
  },
  {
    id: 'mcp-git',
    name: 'git',
    type: 'mcp-server',
    useCases: ['reference', 'source-control'],
    description:
      'Official Anthropic reference server — read, search, and manipulate Git repositories.',
    installHint: null,
    url: 'https://github.com/modelcontextprotocol/servers',
    isNew: false,
  },
  {
    id: 'mcp-memory',
    name: 'memory',
    type: 'mcp-server',
    useCases: ['reference', 'agents'],
    description:
      'Official Anthropic reference server — knowledge-graph-based persistent memory system.',
    installHint: null,
    url: 'https://github.com/modelcontextprotocol/servers',
    isNew: false,
  },
  {
    id: 'mcp-sequential-thinking',
    name: 'sequential-thinking',
    type: 'mcp-server',
    useCases: ['reference', 'agents'],
    description:
      'Official Anthropic reference server — dynamic problem-solving via structured thought sequences.',
    installHint: null,
    url: 'https://github.com/modelcontextprotocol/servers',
    isNew: false,
  },
  {
    id: 'mcp-time',
    name: 'time',
    type: 'mcp-server',
    useCases: ['reference'],
    description:
      'Official Anthropic reference server — time queries and timezone conversion.',
    installHint: null,
    url: 'https://github.com/modelcontextprotocol/servers',
    isNew: false,
  },
  {
    id: 'mcp-everything',
    name: 'everything',
    type: 'mcp-server',
    useCases: ['reference'],
    description:
      'Official Anthropic reference/test server — showcases prompts, resources, and tools in one place.',
    installHint: null,
    url: 'https://github.com/modelcontextprotocol/servers',
    isNew: false,
  },
  {
    id: 'mcp-github-vendor',
    name: 'github (vendor)',
    type: 'mcp-server',
    useCases: ['source-control'],
    description: 'GitHub-maintained MCP server — repo search, PRs, issues, and code operations.',
    installHint: null,
    url: 'https://github.com/github/github-mcp-server',
    isNew: false,
  },
  {
    id: 'mcp-stripe',
    name: 'stripe',
    type: 'mcp-server',
    useCases: ['infrastructure'],
    description: 'Stripe-maintained MCP server — Payments API access for building and debugging integrations.',
    installHint: null,
    url: 'https://github.com/stripe/agent-toolkit',
    isNew: false,
  },
  {
    id: 'mcp-playwright',
    name: 'playwright',
    type: 'mcp-server',
    useCases: ['browser-automation'],
    description:
      'Microsoft-maintained MCP server — browser automation and end-to-end testing via Playwright.',
    installHint: null,
    url: 'https://github.com/microsoft/playwright-mcp',
    isNew: false,
  },
  {
    id: 'mcp-cloudflare',
    name: 'cloudflare',
    type: 'mcp-server',
    useCases: ['infrastructure'],
    description:
      'Cloudflare-maintained MCP server — Workers, KV, D1, and edge configuration.',
    installHint: null,
    url: 'https://github.com/cloudflare/mcp-server-cloudflare',
    isNew: false,
  },
  {
    id: 'mcp-repomix',
    name: 'repomix-mcp',
    type: 'mcp-server',
    useCases: ['context-management'],
    description:
      'Repomix MCP server — surfaces repository context-packing as an MCP tool; newest addition to the context-management toolchain.',
    installHint: null,
    url: 'https://mcpservers.org/servers/Aeolun/repomix-mcp',
    isNew: true,
  },
  // ── Skills ────────────────────────────────────────────────────────────────
  {
    id: 'skill-deep-research',
    name: 'deep-research',
    type: 'skill',
    useCases: ['reference', 'agents'],
    description:
      'Fan-out web searches, fetch sources, adversarially verify claims, and synthesize a cited report. Built-in Claude Code skill.',
    installHint: '/deep-research',
    url: 'https://code.claude.com/docs/en/skills',
    isNew: false,
  },
  {
    id: 'skill-code-review',
    name: 'code-review',
    type: 'skill',
    useCases: ['workflow', 'security'],
    description:
      'Review the current diff for correctness bugs and simplification opportunities at configurable effort levels.',
    installHint: '/code-review',
    url: 'https://code.claude.com/docs/en/skills',
    isNew: false,
  },
  {
    id: 'skill-verify',
    name: 'verify',
    type: 'skill',
    useCases: ['workflow', 'browser-automation'],
    description:
      'Run the app and observe behavior to confirm a fix works or a feature is correct before shipping.',
    installHint: '/verify',
    url: 'https://code.claude.com/docs/en/skills',
    isNew: false,
  },
  {
    id: 'skill-run',
    name: 'run',
    type: 'skill',
    useCases: ['workflow'],
    description:
      'Launch and drive the project\'s app to see a change working — CLI, server, TUI, Electron, or browser-driven.',
    installHint: '/run',
    url: 'https://code.claude.com/docs/en/skills',
    isNew: false,
  },
  {
    id: 'skill-superpowers',
    name: 'superpowers',
    type: 'skill',
    useCases: ['agents', 'workflow'],
    description:
      'Meta-skill bundle: parallel agent dispatching, worktrees, TDD, systematic debugging, code review, and finishing branches.',
    installHint: '/superpowers:using-superpowers',
    url: 'https://code.claude.com/docs/en/skills',
    isNew: false,
  },
  // ── Community Repos ───────────────────────────────────────────────────────
  {
    id: 'repo-awesome-claude-code-toolkit',
    name: 'Everything Claude Code',
    type: 'repo',
    useCases: ['reference', 'agents', 'workflow'],
    description:
      '135 agents, 35 skills, 42 commands, 176+ plugins, 20 hooks, 15 rules, 7 templates — the highest-activity community resource. ~163k stars.',
    installHint: null,
    url: 'https://github.com/rohitg00/awesome-claude-code-toolkit',
    isNew: true,
  },
  {
    id: 'repo-awesome-claude-code',
    name: 'awesome-claude-code',
    type: 'repo',
    useCases: ['reference'],
    description:
      'Curated index of skills, hooks, slash commands, agent orchestrators, and applications. 44k stars.',
    installHint: null,
    url: 'https://github.com/hesreallyhim/awesome-claude-code',
    isNew: false,
  },
  {
    id: 'repo-repomix',
    name: 'repomix',
    type: 'repo',
    useCases: ['context-management'],
    description:
      'Packs an entire repository into one AI-friendly file. `npx repomix` in any project. Chrome extension adds a "Pack" button to GitHub. 20.9k stars.',
    installHint: 'npx repomix',
    url: 'https://github.com/yamadashy/repomix',
    isNew: true,
  },
  {
    id: 'repo-claude-plugins-official',
    name: 'claude-plugins-official',
    type: 'repo',
    useCases: ['reference', 'workflow'],
    description:
      'Official Anthropic plugin marketplace — 55+ curated plugins. Browse `plugins/` for reference implementations. 30.5k stars.',
    installHint: '/plugin marketplace add anthropics/claude-plugins-official',
    url: 'https://github.com/anthropics/claude-plugins-official',
    isNew: false,
  },
  {
    id: 'repo-mcp-typescript-sdk',
    name: 'mcp-typescript-sdk',
    type: 'repo',
    useCases: ['reference', 'agents'],
    description:
      'Official TypeScript SDK for building MCP servers and clients — required for any new MCP server.',
    installHint: 'npm install @modelcontextprotocol/sdk',
    url: 'https://github.com/modelcontextprotocol/typescript-sdk',
    isNew: false,
  },
]

// ── Filter logic ──────────────────────────────────────────────────────────────

export interface EcosystemFilters {
  type: ItemType | 'all'
  useCase: UseCase | 'all'
  query: string
  newOnly: boolean
}

export const DEFAULT_FILTERS: EcosystemFilters = {
  type: 'all',
  useCase: 'all',
  query: '',
  newOnly: false,
}

/**
 * Returns the subset of ECOSYSTEM_ITEMS that match all active filters.
 * Deterministic — stable sort by isNew desc then name asc.
 */
export function filterItems(
  items: EcosystemItem[],
  filters: EcosystemFilters,
): EcosystemItem[] {
  const normalizedQuery = filters.query.trim().toLowerCase()

  const matched = items.filter(item => {
    if (filters.type !== 'all' && item.type !== filters.type) return false
    if (filters.useCase !== 'all' && !item.useCases.includes(filters.useCase)) return false
    if (filters.newOnly && !item.isNew) return false
    if (normalizedQuery.length > 0) {
      const searchTarget = `${item.name} ${item.description}`.toLowerCase()
      if (!searchTarget.includes(normalizedQuery)) return false
    }
    return true
  })

  return matched.slice().sort((a, b) => {
    // New items first, then alphabetical
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

/**
 * Human-readable label for a type value.
 */
export function typeLabel(type: ItemType | 'all'): string {
  const labels: Record<ItemType | 'all', string> = {
    all: 'All types',
    plugin: 'Plugin',
    'mcp-server': 'MCP Server',
    skill: 'Skill',
    repo: 'Repository',
  }
  return labels[type]
}

/**
 * Human-readable label for a use-case value.
 */
export function useCaseLabel(useCase: UseCase | 'all'): string {
  const labels: Record<UseCase | 'all', string> = {
    all: 'All use cases',
    'code-intelligence': 'Code Intelligence',
    'source-control': 'Source Control',
    'project-management': 'Project Management',
    design: 'Design',
    infrastructure: 'Infrastructure',
    communication: 'Communication',
    security: 'Security',
    workflow: 'Workflow',
    'output-style': 'Output Style',
    reference: 'Reference',
    'context-management': 'Context Management',
    database: 'Database',
    monitoring: 'Monitoring',
    'browser-automation': 'Browser Automation',
    agents: 'Agents',
  }
  return labels[useCase]
}

/** All type options including sentinel. */
export const ALL_TYPES: (ItemType | 'all')[] = [
  'all',
  'plugin',
  'mcp-server',
  'skill',
  'repo',
]

/** All use-case options including sentinel. */
export const ALL_USE_CASES: (UseCase | 'all')[] = [
  'all',
  'agents',
  'browser-automation',
  'code-intelligence',
  'communication',
  'context-management',
  'database',
  'design',
  'infrastructure',
  'monitoring',
  'output-style',
  'project-management',
  'reference',
  'security',
  'source-control',
  'workflow',
]

/**
 * Badge color token for a given item type.
 * Returns a Tailwind class string using only design tokens.
 */
export function typeBadgeClasses(type: ItemType): string {
  const map: Record<ItemType, string> = {
    plugin: 'bg-accent-subtle text-accent',
    'mcp-server': 'bg-note-subtle text-note',
    skill: 'bg-tip-subtle text-tip',
    repo: 'bg-warning-subtle text-warning',
  }
  return map[type]
}
