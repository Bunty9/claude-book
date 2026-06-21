import React from 'react'

/**
 * Explicit map of chapter id → lazy MDX module factory.
 * Add an entry here when a new chapter MDX file is authored.
 * Keeping this explicit (not a template-literal import) lets Next's static
 * export bundler analyse all branches at build time.
 */
export const CHAPTERS_MDX: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  // P0 — Orientation
  'what-is-an-llm': () => import('@/content/p0/what-is-an-llm.mdx'),
  'how-to-use-this-book': () => import('@/content/p0/how-to-use-this-book.mdx'),
  'what-is-claude': () => import('@/content/p0/what-is-claude.mdx'),
  'what-is-claude-code': () => import('@/content/p0/what-is-claude-code.mdx'),
  // P1 — First Contact
  'install-first-session': () => import('@/content/p1/install-first-session.mdx'),
  'the-chat-loop': () => import('@/content/p1/the-chat-loop.mdx'),
  'permissions-and-safety': () => import('@/content/p1/permissions-and-safety.mdx'),
  'first-task-e2e': () => import('@/content/p1/first-task-e2e.mdx'),
  // P2 — The Harness
  'agent-loop-anatomy': () => import('@/content/p2/agent-loop-anatomy.mdx'),
  'tool-surface': () => import('@/content/p2/tool-surface.mdx'),
  'permissions-modes-deep': () => import('@/content/p2/permissions-modes-deep.mdx'),
  'hooks': () => import('@/content/p2/hooks.mdx'),
  'slash-commands': () => import('@/content/p2/slash-commands.mdx'),
  'settings-env': () => import('@/content/p2/settings-env.mdx'),
  // P3 — Context Engineering
  'context-window-budget': () => import('@/content/p3/context-window-budget.mdx'),
  'compaction-autocompact': () => import('@/content/p3/compaction-autocompact.mdx'),
  'memory-claude-md': () => import('@/content/p3/memory-claude-md.mdx'),
  'long-running-no-bloat': () => import('@/content/p3/long-running-no-bloat.mdx'),
  'docs-as-context': () => import('@/content/p3/docs-as-context.mdx'),
  // P4 — Prompting & Spec Engineering
  'effective-prompting': () => import('@/content/p4/effective-prompting.mdx'),
  'output-styles': () => import('@/content/p4/output-styles.mdx'),
  'plan-an-idea': () => import('@/content/p4/plan-an-idea.mdx'),
  'tdd-with-cheap-agents': () => import('@/content/p4/tdd-with-cheap-agents.mdx'),
  'what-claude-expects-trust': () => import('@/content/p4/what-claude-expects-trust.mdx'),
  // P5 — Multi-Agent Orchestration
  'subagents': () => import('@/content/p5/subagents.mdx'),
  'parallel-agent-teams': () => import('@/content/p5/parallel-agent-teams.mdx'),
  'workflows': () => import('@/content/p5/workflows.mdx'),
  'worktrees': () => import('@/content/p5/worktrees.mdx'),
  'cost-tiering': () => import('@/content/p5/cost-tiering.mdx'),
  // P6 — The Dev Workflow
  'offload-every-stage': () => import('@/content/p6/offload-every-stage.mdx'),
  'git-pr-cicd': () => import('@/content/p6/git-pr-cicd.mdx'),
  'code-review-panels': () => import('@/content/p6/code-review-panels.mdx'),
  'case-study-feature-ship': () => import('@/content/p6/case-study-feature-ship.mdx'),
  // P7 — Extending Claude
  'skills-use-write': () => import('@/content/p7/skills-use-write.mdx'),
  'plugins-marketplaces': () => import('@/content/p7/plugins-marketplaces.mdx'),
  'mcp-use-build': () => import('@/content/p7/mcp-use-build.mdx'),
  'api-agent-sdk': () => import('@/content/p7/api-agent-sdk.mdx'),
  'browser-ide-extensions': () => import('@/content/p7/browser-ide-extensions.mdx'),
  'headless-cli': () => import('@/content/p7/headless-cli.mdx'),
  // P8 — Automation & Integrations
  'automate-daily-tasks': () => import('@/content/p8/automate-daily-tasks.mdx'),
  'n8n-gsuite': () => import('@/content/p8/n8n-gsuite.mdx'),
  'zapier-mcp': () => import('@/content/p8/zapier-mcp.mdx'),
  'scheduling': () => import('@/content/p8/scheduling.mdx'),
  'personal-automation-system': () => import('@/content/p8/personal-automation-system.mdx'),
  // P9 — Mastery & Power User
  'how-a-power-user-works': () => import('@/content/p9/how-a-power-user-works.mdx'),
  'maximizing-performance': () => import('@/content/p9/maximizing-performance.mdx'),
  'keeping-up-latest': () => import('@/content/p9/keeping-up-latest.mdx'),
  'delegation-maturity': () => import('@/content/p9/delegation-maturity.mdx'),
  // P10 — Reference
  'tool-reference': () => import('@/content/p10/tool-reference.mdx'),
  'slash-command-reference': () => import('@/content/p10/slash-command-reference.mdx'),
  'glossary': () => import('@/content/p10/glossary.mdx'),
  'model-pricing-tables': () => import('@/content/p10/model-pricing-tables.mdx'),
  'links': () => import('@/content/p10/links.mdx'),
}

/**
 * The set of chapter ids registered in CHAPTERS_MDX.
 * Used by tests to verify that every manifest chapter has an MDX entry.
 */
export const REGISTERED_CHAPTER_IDS: readonly string[] = Object.keys(CHAPTERS_MDX)
