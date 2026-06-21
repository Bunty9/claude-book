# Research Packet B: Claude / Claude Code Ecosystem
## Plugins, Marketplaces, MCP Servers, Skills, and Standout GitHub Repos

**Prepared:** 2026-06-21  
**Scope:** Current state of the Claude Code and MCP ecosystem — official marketplaces, plugin system, MCP registries, notable servers, community tooling, and standout GitHub repositories.  
**Methodology:** WebSearch (multiple targeted queries) + WebFetch of official docs (code.claude.com, registry.modelcontextprotocol.io, github.com/anthropics). All claims cited inline. Confidence ratings: high = official source / primary doc; med = reputable secondary; low = aggregate/estimate.

---

## 1. Claude Code Plugin System

### 1.1 Plugin Architecture

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| Claude Code has a formal plugin system as of 2026 | Plugins are versioned bundles containing any combination of: skills, agents, hooks, MCP server configs (`.mcp.json`), LSP server configs (`.lsp.json`), background monitors, and a `bin/` directory added to PATH | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | 2026-06-21 | high |
| Plugin manifest lives at `.claude-plugin/plugin.json` | Fields: `name` (namespace), `description`, `version`, `author`, `homepage`, `repository`, `license`. Name becomes skill namespace prefix (e.g. `/my-plugin:hello`) | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | 2026-06-21 | high |
| Plugins support background monitors | `monitors/monitors.json` array — each entry runs a shell command; every stdout line is delivered to Claude as a notification. Auto-armed at session start | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | 2026-06-21 | high |
| `--plugin-dir` flag accepts `.zip` archives | Requires Claude Code v2.1.128 or later | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | 2026-06-21 | high |
| `--plugin-url` flag fetches remote zip at startup | Useful for CI artifacts; same trust considerations as installed plugins | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | 2026-06-21 | high |
| `settings.json` inside a plugin can set the default agent | `{"agent": "security-reviewer"}` activates a custom agent as the main thread for the session; only `agent` and `subagentLinksStatusLine` keys currently supported | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | 2026-06-21 | high |
| Plugin context cost visible before install | As of v2.1.143, the Discover tab shows a Context cost estimate (tokens per turn) for each plugin; Last updated date added in v2.1.144; "Will install" component preview in v2.1.145 | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| Scoped installation: user / project / local | Project scope writes to `.claude/settings.json` (shared with team); local scope is per-user per-repo; managed scope set by admins via managed settings | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |

### 1.2 Official Anthropic Marketplace (`claude-plugins-official`)

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| Two official Anthropic marketplaces exist | `claude-plugins-official` (auto-registered on first interactive launch, curated by Anthropic) and `claude-plugins-community` (third-party, manually added via `/plugin marketplace add anthropics/claude-plugins-community`) | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| Official marketplace GitHub repo: 30.5k stars, 3.3k forks | `github.com/anthropics/claude-plugins-official` — contains `/plugins` (Anthropic-maintained) and `/external_plugins` (partner/community) directories | [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | 2026-06-21 | high |
| Online browse URL: `claude.com/plugins` | Alternative to in-app `/plugin > Discover` | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| Submission forms: `claude.ai/admin-settings/…` or `platform.claude.com/plugins/submit` | Community marketplace review only — official marketplace is invite-only at Anthropic's discretion. `claude plugin validate` must pass before submission | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | 2026-06-21 | high |
| Demo marketplace at `anthropics/claude-code` (in-tree `plugins/`) | Must be added manually; shows what's possible. Source of `commit-commands` sample | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |

### 1.3 Official Plugins Catalogue (from `claude-plugins-official`)

**Code Intelligence (LSP) Plugins** — 11 languages, each requires the binary pre-installed:

| Plugin | Language | Binary |
|---|---|---|
| `typescript-lsp` | TypeScript / JS | `typescript-language-server` |
| `pyright-lsp` | Python | `pyright-langserver` |
| `rust-analyzer-lsp` | Rust | `rust-analyzer` |
| `gopls-lsp` | Go | `gopls` |
| `clangd-lsp` | C/C++ | `clangd` |
| `jdtls-lsp` | Java | `jdtls` |
| `kotlin-lsp` | Kotlin | `kotlin-language-server` |
| `csharp-lsp` | C# | `csharp-ls` |
| `php-lsp` | PHP | `intelephense` |
| `lua-lsp` | Lua | `lua-language-server` |
| `swift-lsp` | Swift | `sourcekit-lsp` |

Source: [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | last_verified: 2026-06-21 | confidence: high

**External Integration Plugins** (bundle pre-configured MCP servers):

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| Source control: `github`, `gitlab` | Install with `/plugin install github@claude-plugins-official` | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| Project management: `atlassian`, `asana`, `linear`, `notion` | Atlassian covers Jira + Confluence | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| Design: `figma` | Official Figma MCP bundled | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| Infrastructure: `vercel`, `firebase`, `supabase` | Full deploy-platform integrations | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| Communication: `slack` | Official Slack MCP bundled | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| Monitoring: `sentry` | Error tracking integration | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |

**Development Workflow Plugins:**

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| `security-guidance` plugin | Reviews each change Claude makes for common vulnerabilities; instructs Claude to fix in-session. Released May 2026 — newest to try flag | [cybersecuritynews.com/anthropic-updates-claude-code](https://cybersecuritynews.com/anthropic-updates-claude-code/) + [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| `commit-commands` | Git commit workflows: commit, push, PR creation skills | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| `pr-review-toolkit` | Specialized agents for reviewing pull requests | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| `agent-sdk-dev` | Tools for building with the Claude Agent SDK | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| `plugin-dev` | Toolkit for creating plugins | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| `feature-dev` | 7-phase guided feature development workflow | [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/feature-dev/README.md) | 2026-06-21 | high |
| `claude-md-management` | Audits and maintains CLAUDE.md files, captures session learnings | [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/claude-md-management/README.md) | 2026-06-21 | high |
| `frontend-design` | Frontend design guidance with attention to detail | [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/frontend-design/README.md) | 2026-06-21 | high |
| `claude-code-setup` | Analyzes codebases and recommends tailored Claude Code automations | [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/claude-code-setup/README.md) | 2026-06-21 | high |

**Output Style Plugins:**

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| `explanatory-output-style` | Educational insights about implementation choices | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| `learning-output-style` | Interactive learning mode for skill building | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |

---

## 2. MCP (Model Context Protocol) Ecosystem

### 2.1 Governance and Scale

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| MCP donated to the Linux Foundation's Agentic AI Foundation (AAIF) | Announced December 9, 2025. Founding projects: Anthropic's MCP, Block's goose, OpenAI's AGENTS.md | [linuxfoundation.org/press/linux-foundation-announces…](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) + [anthropic.com/news/donating-the-model-context-protocol…](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation) | 2026-06-21 | high |
| AAIF Platinum members include AWS, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI | Multi-vendor governance prevents single-vendor lock-in | [linuxfoundation.org](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation) | 2026-06-21 | high |
| MCP adopted beyond Claude: ChatGPT, Cursor, Gemini, Microsoft Copilot, VS Code | Cross-platform standard as of H1 2026 | [qcode.cc/mcp-servers-ecosystem-2026](https://www.qcode.cc/mcp-servers-ecosystem-2026) | 2026-06-21 | med |
| 13,000+ public MCP servers tracked across major directories as of June 2026 | Q2 2026 closed with ~9,400 published servers across the four major registries, +58% QoQ growth rate for three straight quarters | [digitalapplied.com/blog/mcp-adoption-statistics-2026](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol) | 2026-06-21 | med |

### 2.2 MCP Registries Compared

| Registry | Server Count (June 2026) | Notes | Source | last_verified | confidence |
|---|---|---|---|---|---|
| PulseMCP (`pulsemcp.com`) | 15,930+ | Largest; updated daily; +1,000/month pace in Q1–Q2 | [pulsemcp.com/servers](https://www.pulsemcp.com/servers) | 2026-06-21 | med |
| mcp.so | 17,000+ | Community directory | [qcode.cc](https://www.qcode.cc/mcp-servers-ecosystem-2026) | 2026-06-21 | low |
| Glama | 12,600+ | Community directory with ratings | [qcode.cc](https://www.qcode.cc/mcp-servers-ecosystem-2026) | 2026-06-21 | low |
| Smithery (`smithery.ai`) | 7,300+ | Also a managed hosting platform; added 1,300 servers Mar–May 2026; provides OAuth modal generation and usage-count logging | [smithery.ai](https://smithery.ai/) + [digitalapplied.com](https://www.digitalapplied.com/blog/mcp-server-ecosystem-tracker-50-servers-cataloged-2026) | 2026-06-21 | med |
| Official MCP Registry (`registry.modelcontextprotocol.io`) | ~2,000 | AAIF-run; open API; community-driven | [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/) | 2026-06-21 | med |
| Composio | 1,000+ toolkits / 20,000+ tools | Bundles multi-tool integrations | [qcode.cc](https://www.qcode.cc/mcp-servers-ecosystem-2026) | 2026-06-21 | med |

### 2.3 Official Anthropic Reference Servers (`modelcontextprotocol/servers`)

7 actively maintained reference servers (all others archived to `servers-archived`):

| Server | Purpose | Source | last_verified | confidence |
|---|---|---|---|---|
| `everything` | Reference/test server with prompts, resources, and tools | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | 2026-06-21 | high |
| `fetch` | Web content fetching and HTML→markdown conversion | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | 2026-06-21 | high |
| `filesystem` | Secure file operations with configurable access controls | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | 2026-06-21 | high |
| `git` | Read, search, and manipulate Git repositories | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | 2026-06-21 | high |
| `memory` | Knowledge-graph-based persistent memory system | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | 2026-06-21 | high |
| `sequential-thinking` | Dynamic problem-solving via thought sequences | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | 2026-06-21 | high |
| `time` | Time and timezone conversion | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | 2026-06-21 | high |

Archived (now vendor-maintained): GitHub, GitLab, Slack, Google Drive, Postgres, Sentry, SQLite, Puppeteer, EverArt, AWS-KB, Redis, Google Maps, Brave Search.

Source: [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | last_verified: 2026-06-21 | confidence: high

### 2.4 Tier-1 Vendor-Maintained MCP Servers

~50 vendor-maintained "tier-1" servers exist as of June 2026. Notable ones:

| Vendor | Server / Product | Notable Feature | Source | last_verified | confidence |
|---|---|---|---|---|---|
| GitHub | `github` | Repo search, PR, issues, code | [techsy.io/blog/best-mcp-servers-2026](https://techsy.io/en/blog/best-mcp-servers-2026) | 2026-06-21 | med |
| Figma | `figma` | Design file access, inspection | [builder.io/blog/best-mcp-servers-2026](https://www.builder.io/blog/best-mcp-servers-2026) | 2026-06-21 | med |
| Stripe | `stripe` | Payments API access | [builder.io/blog/best-mcp-servers-2026](https://www.builder.io/blog/best-mcp-servers-2026) | 2026-06-21 | med |
| Supabase | `supabase` | DB queries, edge functions; EMA-supported | [builder.io/blog/best-mcp-servers-2026](https://www.builder.io/blog/best-mcp-servers-2026) | 2026-06-21 | med |
| Linear | `linear` | Issue tracking; EMA-supported | [builder.io/blog/best-mcp-servers-2026](https://www.builder.io/blog/best-mcp-servers-2026) | 2026-06-21 | med |
| Notion | `notion` | Pages, databases | [builder.io/blog/best-mcp-servers-2026](https://www.builder.io/blog/best-mcp-servers-2026) | 2026-06-21 | med |
| Cloudflare | `cloudflare` | Workers, KV, D1 | [builder.io/blog/best-mcp-servers-2026](https://www.builder.io/blog/best-mcp-servers-2026) | 2026-06-21 | med |
| Atlassian | `atlassian` | Jira + Confluence; EMA-supported | [techtimes.com/…/mcp-enterprise-authorization-goes-stable](https://www.techtimes.com/articles/318708/20260619/mcp-enterprise-authorization-goes-stable-zero-touch-sso-okta-anthropic-vs-code.htm) | 2026-06-21 | high |
| Asana | `asana` | Task management; EMA-supported | [techtimes.com](https://www.techtimes.com/articles/318708/20260619/mcp-enterprise-authorization-goes-stable-zero-touch-sso-okta-anthropic-vs-code.htm) | 2026-06-21 | high |
| Canva | `canva` | Design platform; EMA-supported | [techtimes.com](https://www.techtimes.com/articles/318708/20260619/mcp-enterprise-authorization-goes-stable-zero-touch-sso-okta-anthropic-vs-code.htm) | 2026-06-21 | high |
| Sentry | `sentry` | Error monitoring | [techsy.io](https://techsy.io/en/blog/best-mcp-servers-2026) | 2026-06-21 | med |
| Microsoft Playwright | `playwright` | Browser automation / e2e | [techsy.io](https://techsy.io/en/blog/best-mcp-servers-2026) | 2026-06-21 | med |
| Vercel | `vercel` | Deploy, preview, env | [techsy.io](https://techsy.io/en/blog/best-mcp-servers-2026) | 2026-06-21 | med |
| AWS | `aws` (various) | AWS SDK wrappers | [qcode.cc](https://www.qcode.cc/mcp-servers-ecosystem-2026) | 2026-06-21 | med |

### 2.5 MCP Enterprise Authorization (newest to try)

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| Enterprise-Managed Authorization (EMA) reached stable status June 18, 2026 | Replaces per-user OAuth consent screens with zero-touch IdP-delegated flow. Okta is first supported IdP | [blog.modelcontextprotocol.io/posts/enterprise-managed-auth](https://blog.modelcontextprotocol.io/posts/enterprise-managed-auth/) + [claude.com/blog/enterprise-managed-auth](https://claude.com/blog/enterprise-managed-auth) | 2026-06-21 | high |
| Anthropic's EMA implementation is in beta for Team + Enterprise plans | Configuration in Claude also applies automatically to Claude Code and Cowork | [claude.com/blog/enterprise-managed-auth](https://claude.com/blog/enterprise-managed-auth) | 2026-06-21 | high |
| Servers supporting EMA at launch: Asana, Atlassian, Canva, Figma, Granola, Linear, Supabase | Slack and others actively adding support | [techtimes.com/…/mcp-enterprise-authorization-goes-stable](https://www.techtimes.com/articles/318708/20260619/mcp-enterprise-authorization-goes-stable-zero-touch-sso-okta-anthropic-vs-code.htm) | 2026-06-21 | high |

---

## 3. Skills System

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| Skills are markdown instruction files Claude uses automatically | Each skill is a folder under `skills/` containing a `SKILL.md` file. Frontmatter includes `description` (when to invoke), `disable-model-invocation`, tool restrictions | [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) | 2026-06-21 | high |
| Skills reload without restart | `/reload-plugins` picks up changes to skills, agents, hooks, MCP servers, LSP servers | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | 2026-06-21 | high |
| `$ARGUMENTS` placeholder in SKILL.md for dynamic input | User text after slash command name is passed to the skill | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | 2026-06-21 | high |
| `claude plugin init <name>` scaffolds a skills-dir plugin | Creates `~/.claude/skills/<name>/` with manifest + starter SKILL.md; loads automatically as `<name>@skills-dir` | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) (v2.1.157) | 2026-06-21 | high |

---

## 4. Sub-Agents (Custom Agents)

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| Custom sub-agents defined via markdown in `.claude/agents/` | Frontmatter fields: `name`, `description`, `tools`, `model`, system-prompt body. Claude picks them automatically based on context | [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents) | 2026-06-21 | high |
| Sub-agents can now spawn sub-agents up to 5 levels deep | Added in v2.1.172 (June 10, 2026) | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |
| Dynamic Workflows (June 2026): lead agent fans out tens–hundreds of parallel sub-agents | Performance Outcomes feature: grader sends sub-agents back to revise until rubric is met | [mindstudio.ai/blog/code-with-claude-2026-new-agent-features](https://www.mindstudio.ai/blog/code-with-claude-2026-new-agent-features) | 2026-06-21 | med |
| Agent teams: as of v2.1.178, implicit team on every session — no TeamCreate/TeamDelete needed | `Tool(param:value)` syntax for permission rules (e.g. `Agent(model:opus)`) | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |

---

## 5. Hooks System

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| Hooks fire at lifecycle events: PreToolUse, PostToolUse, PreCompact, PostCompact, SessionStart, SessionEnd | PreToolUse is the primary security gate; can block a tool call by returning non-zero exit code | [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks) | 2026-06-21 | high |
| PreCompact hooks can block compaction | Exit with code 2 or return `{"decision":"block"}` | [scriptbyai.com/claude-code-resource-list](https://www.scriptbyai.com/claude-code-resource-list/) | 2026-06-21 | med |
| Hooks in plugins live at `hooks/hooks.json` | Same schema as settings.json hooks; command receives JSON on stdin | [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) | 2026-06-21 | high |
| `post-session` lifecycle hook added in v2.1.169 | For self-hosted runners: snapshots uncommitted work | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |

---

## 6. Standout GitHub Repositories

### 6.1 Core / Official

| Repo | Stars | Description | Newest-to-try? | Source | last_verified | confidence |
|---|---|---|---|---|---|---|
| `anthropics/claude-code` | ~132k | Official Claude Code CLI. Plugin demos in `plugins/` subtree | No (stable, use daily) | [github.com/anthropics/claude-code](https://github.com/anthropics/claude-code) | 2026-06-21 | high |
| `anthropics/claude-plugins-official` | 30.5k | Official plugin marketplace with 55+ curated plugins | Yes — browse `plugins/` for reference implementations | [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | 2026-06-21 | high |
| `anthropics/claude-plugins-community` | N/A | Community marketplace (third-party, review-gated) | Yes — new submissions arrive regularly | [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) | 2026-06-21 | high |
| `modelcontextprotocol/servers` | N/A | 7 active reference MCP server implementations | No (reference only) | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | 2026-06-21 | high |
| `modelcontextprotocol/typescript-sdk` | N/A | Official TypeScript SDK for building MCP servers/clients | Yes — needed for any new MCP server | [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | 2026-06-21 | high |
| `modelcontextprotocol/python-sdk` | N/A | Official Python SDK for building MCP servers/clients | Yes — needed for Python MCP servers | [github.com/modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk) | 2026-06-21 | high |

### 6.2 Community / Ecosystem

| Repo | Stars | Description | Newest-to-try? | Source | last_verified | confidence |
|---|---|---|---|---|---|---|
| `rohitg00/awesome-claude-code-toolkit` (Everything Claude Code) | 100k–170k (growing rapidly; reported 163k mid-June) | 135 agents, 35 curated skills, 42 commands, 176+ plugins, 20 hooks, 15 rules, 7 templates, 14 MCP configs, 26 companion apps. Portable, version-controlled | Yes — highest-activity community resource | [augmentcode.com/learn/everything-claude-code-github](https://www.augmentcode.com/learn/everything-claude-code-github) + [github.com/rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) | 2026-06-21 | med |
| `hesreallyhim/awesome-claude-code` | 44k | Curated index: skills, hooks, slash commands, agent orchestrators, applications, plugins | No (index, not installable) | [github.com/hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | 2026-06-21 | med |
| `jqueryscript/awesome-claude-code` | N/A | Curated list of tools, IDE integrations, frameworks for Claude Code | No (index) | [github.com/jqueryscript/awesome-claude-code](https://github.com/jqueryscript/awesome-claude-code) | 2026-06-21 | med |
| `ComposioHQ/awesome-claude-plugins` | N/A | Curated list of plugins — custom commands, agents, hooks, MCP | No (index) | [github.com/ComposioHQ/awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) | 2026-06-21 | med |
| `quemsah/awesome-claude-plugins` | N/A | Automated plugin adoption metrics from GitHub repos using n8n workflows | Yes — data tool for plugin popularity | [github.com/quemsah/awesome-claude-plugins](https://github.com/quemsah/awesome-claude-plugins) | 2026-06-21 | med |
| `yamadashy/repomix` | 20.9k | Packs entire repository into one AI-friendly file. `npx repomix` in any project. Chrome extension adds "Pack" button to GitHub. Also has its own MCP server at `mcpservers.org/servers/Aeolun/repomix-mcp` | Yes — essential context-management tool | [github.com/yamadashy/repomix](https://github.com/yamadashy/repomix) | 2026-06-21 | high |
| Anthropic Claude Cookbooks | 45.4k | Jupyter notebooks/recipes for Claude API patterns | No (reference) | [kdnuggets.com/10-github-repositories-to-master-claude-code](https://www.kdnuggets.com/10-github-repositories-to-master-claude-code) | 2026-06-21 | med |

---

## 7. Recent Claude Code Changelog Highlights (May–June 2026)

Selected releases from the official changelog that affect the plugin/ecosystem surface:

| Version | Date | Key Ecosystem Feature | Source | last_verified | confidence |
|---|---|---|---|---|---|
| 2.1.185 | 2026-06-20 | Stream-stall hint improved (UX) | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |
| 2.1.183 | 2026-06-19 | Auto mode safety: blocks destructive git/terraform/pulumi unless requested. `attribution.sessionUrl` setting | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |
| 2.1.178 | 2026-06-15 | Agent teams implicit — no `TeamCreate`/`TeamDelete` needed; `Tool(param:value)` permission syntax | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |
| 2.1.172 | 2026-06-10 | Sub-agents can spawn sub-agents (up to 5 levels). Marketplace search bar in `/plugin` | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |
| 2.1.170 | 2026-06-09 | Claude Fable 5 ("Mythos-class") model released to general availability | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |
| 2.1.169 | 2026-06-08 | `post-session` lifecycle hook; `--safe-mode` flag disables customizations; `/cd` command | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |
| 2.1.166 | 2026-06-06 | `fallbackModel` setting (up to 3 fallbacks); glob deny rules; disable thinking flag | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |
| 2.1.163 | 2026-06-04 | `/plugin list --enabled/--disabled`; `requiredMinimumVersion` managed setting | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |
| 2.1.158 | 2026-05-30 | Auto mode on Bedrock, Vertex, Foundry for Opus 4.7/4.8 | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |
| 2.1.157 | 2026-05-29 | Plugins in `.claude/skills` auto-load; `claude plugin init <name>` scaffolding; `EnterWorktree` mid-session switch | [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog) | 2026-06-21 | high |

---

## 8. Third-Party Marketplace / Directory Infrastructure

| Claim | Detail | Source | last_verified | confidence |
|---|---|---|---|---|
| `claudemarketplaces.com` — unofficial community index | 300k+ developer visits/month; daily-updated from GitHub; aggregates skills, MCP, plugins | [claudemarketplaces.com](https://claudemarketplaces.com/) | 2026-06-21 | med |
| `claudefa.st` — full changelog + add-on tracking | Running changelog digest and curated add-on catalog | [claudefa.st/blog/guide/changelog](https://claudefa.st/blog/guide/changelog) | 2026-06-21 | med |
| `mcpmarket.com` — business-focused MCP directory | Lists Claude MCP servers by business category | [mcpmarket.com/businesses/claude](https://mcpmarket.com/businesses/claude) | 2026-06-21 | med |
| `mcpmanager.ai` — adoption statistics tracker | Reports 50 most popular MCP servers with usage data | [mcpmanager.ai/blog/most-popular-mcp-servers](https://mcpmanager.ai/blog/most-popular-mcp-servers/) | 2026-06-21 | med |
| Smithery provides hosted MCP server infrastructure | Generated OAuth modals, usage-count logging, flexible local/cloud deployment | [smithery.ai](https://smithery.ai/) + [workos.com/blog/smithery-ai](https://workos.com/blog/smithery-ai) | 2026-06-21 | med |

---

## 9. "Newest to Try" Flags — Summary

Items flagged for recency + novelty:

1. **`security-guidance` plugin** (official, May 2026) — real-time vulnerability review on every change Claude writes. Install: `/plugin install security-guidance@claude-plugins-official`
2. **MCP Enterprise-Managed Authorization (EMA)** (stable June 18, 2026) — zero-touch Okta SSO for MCP servers in Team/Enterprise. Servers: Asana, Atlassian, Canva, Figma, Granola, Linear, Supabase live now
3. **Sub-agents spawning sub-agents 5 levels deep** (v2.1.172, June 10, 2026) — enables truly hierarchical agent teams
4. **Claude Fable 5 (v2.1.170, June 9, 2026)** — "Mythos-class" model now GA; agent frontmatter can pin to it
5. **`claude plugin init <name>` scaffolding** (v2.1.157, May 29, 2026) — one-command plugin creation in skills dir
6. **Repomix MCP server** (`mcpservers.org/servers/Aeolun/repomix-mcp`) — surfaces Repomix's context-packing as an MCP tool; newest addition to context-management toolchain
7. **`plugin marketplace add anthropics/claude-plugins-community`** — community marketplace now has review-gated third-party plugins; growing fastest of any catalog
8. **`fallbackModel` setting** (v2.1.166, June 6, 2026) — up to 3 ordered fallbacks for cost/availability management

---

## 10. Sources Index

- [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins)
- [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins)
- [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog)
- [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)
- [code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)
- [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- [github.com/anthropics/claude-code](https://github.com/anthropics/claude-code)
- [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- [github.com/modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk)
- [github.com/yamadashy/repomix](https://github.com/yamadashy/repomix)
- [github.com/hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- [github.com/rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit)
- [blog.modelcontextprotocol.io/posts/enterprise-managed-auth](https://blog.modelcontextprotocol.io/posts/enterprise-managed-auth/)
- [claude.com/blog/enterprise-managed-auth](https://claude.com/blog/enterprise-managed-auth)
- [anthropic.com/news/donating-the-model-context-protocol…](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
- [linuxfoundation.org/press/linux-foundation-announces…](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [techtimes.com/…/mcp-enterprise-authorization-goes-stable](https://www.techtimes.com/articles/318708/20260619/mcp-enterprise-authorization-goes-stable-zero-touch-sso-okta-anthropic-vs-code.htm)
- [smithery.ai](https://smithery.ai/)
- [pulsemcp.com](https://www.pulsemcp.com/)
- [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/)
- [digitalapplied.com/blog/mcp-adoption-statistics-2026](https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol)
- [cybersecuritynews.com/anthropic-updates-claude-code](https://cybersecuritynews.com/anthropic-updates-claude-code/)
- [claudemarketplaces.com](https://claudemarketplaces.com/)
- [augmentcode.com/learn/everything-claude-code-github](https://www.augmentcode.com/learn/everything-claude-code-github)
