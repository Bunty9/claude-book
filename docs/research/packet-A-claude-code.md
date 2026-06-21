# Research Packet A — Claude Code Feature Surface

**Produced by:** Research Team A  
**Date:** 2026-06-21  
**Version:** Claude Code v2.1.185 (as of 2026-06-20)  
**Primary sources:** code.claude.com/docs (official), Agent SDK docs (official), morphllm.com hooks reference, claudefa.st permissions guide, settings reference cross-verified against SchemaStore JSON schema.

---

## Format

Each entry follows:

> **Claim:** [the fact]  
> **Detail:** [elaboration]  
> **Source:** [url or tool name]  
> **last_verified:** 2026-06-21  
> **Confidence:** high | med | low

---

## 1. The Agent Loop

---

**Claim:** The Claude Code agent loop is a turn-based cycle: receive prompt → model evaluates → tool calls dispatched → results fed back → repeat until no tool calls.  
**Detail:** The only runtime state is an append-only message array. Each full cycle (model output + tool execution) is one "turn." The loop terminates when Claude produces a response with no tool call requests. A `ResultMessage` is then emitted with final text, token usage, cost, and session ID.  
**Source:** https://code.claude.com/docs/en/agent-sdk/agent-loop.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** The SDK yields five core message types during the loop: `SystemMessage`, `AssistantMessage`, `UserMessage`, `StreamEvent`, and `ResultMessage`.  
**Detail:** `SystemMessage` covers session lifecycle (init, compact_boundary, informational, worker_shutting_down). `AssistantMessage` fires after each Claude response including the final text-only one. `UserMessage` carries tool results. `StreamEvent` is streaming-only. `ResultMessage` marks end of loop with subtypes: `success`, `error_max_turns`, `error_max_budget_usd`, `error_during_execution`, `error_max_structured_output_retries`.  
**Source:** https://code.claude.com/docs/en/agent-sdk/agent-loop.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Read-only tools (`Read`, `Glob`, `Grep`, and read-only MCP tools) can run concurrently in a single turn; state-modifying tools (`Edit`, `Write`, `Bash`) run sequentially.  
**Detail:** Custom tools default to sequential. Set `readOnlyHint` in tool annotations to enable parallel execution. The SDK decides parallelism automatically per-tool based on this annotation.  
**Source:** https://code.claude.com/docs/en/agent-sdk/agent-loop.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** The loop can be capped by `maxTurns` (tool-use round trips) and `maxBudgetUsd` (spend threshold). Both are options on `ClaudeAgentOptions` (Python) / `Options` (TypeScript).  
**Detail:** Without limits the loop runs indefinitely, which is hazardous for open-ended prompts. `maxTurns` counts only tool-use turns, not the final text-only turn. When either limit fires, the SDK emits a `ResultMessage` with the corresponding error subtype.  
**Source:** https://code.claude.com/docs/en/agent-sdk/agent-loop.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Effort levels control reasoning depth per turn: `low`, `medium`, `high`, `xhigh`, `max`.  
**Detail:** Higher effort = more thinking tokens, higher cost, better results for complex tasks. `xhigh` is recommended for Claude Sonnet 4.7+ and Opus 4.7+. `max` targets multi-step deep analysis. The `/effort` CLI command and `effortLevel` settings key both control this. `effort` is distinct from Extended Thinking (which produces visible chain-of-thought blocks); they can be combined independently.  
**Source:** https://code.claude.com/docs/en/agent-sdk/agent-loop.md; https://claudefa.st/blog/guide/settings-reference  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Context window is append-only across turns within a session; static parts (system prompt, tool definitions, CLAUDE.md) are automatically prompt-cached after the first request.  
**Detail:** Tool outputs consume significant tokens — a large file read can cost thousands of tokens. When context approaches the limit, automatic compaction summarizes older history. A `compact_boundary` system message is emitted. The `/compact` slash command triggers manual compaction.  
**Source:** https://code.claude.com/docs/en/agent-sdk/agent-loop.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 2. Built-in Tool Surface (Complete)

The official tools reference lists 38 named tools. Permission column: "Yes" = prompts user; "No" = no prompt required by default.

---

**Claim:** The complete list of built-in tools (as of v2.1.185) is:

| Tool | Description | Permission Required |
|---|---|---|
| `Agent` | Spawns a named or forked subagent | No |
| `Artifact` | Publishes HTML/Markdown as an org-shared page on claude.ai | Yes |
| `AskUserQuestion` | Multiple-choice clarification questions | No |
| `Bash` | Execute shell commands (2-min default timeout, 30K char output limit) | Yes |
| `CronCreate` | Schedule a recurring or one-shot prompt (session-scoped) | No |
| `CronDelete` | Cancel a scheduled task by ID | No |
| `CronList` | List all session-scheduled tasks | No |
| `Edit` | Exact string replacement in files (requires prior Read) | Yes |
| `EnterPlanMode` | Switch to plan mode (read-only exploration) | No |
| `EnterWorktree` | Create or enter an isolated git worktree | No |
| `ExitPlanMode` | Present plan for approval and exit plan mode | Yes |
| `ExitWorktree` | Exit worktree, return to original directory | No |
| `Glob` | Find files by pattern (supports `**`; results sorted by mtime, capped at 100) | No |
| `Grep` | Search file contents via ripgrep regex (modes: files_with_matches, content, count) | No |
| `ListMcpResourcesTool` | List resources exposed by MCP servers | No |
| `LSP` | Code intelligence: jump-to-def, find-refs, type errors, call hierarchies | No |
| `Monitor` | Background command that feeds output lines back to Claude in real time | Yes |
| `NotebookEdit` | Modify Jupyter notebook cells by cell_id (replace, insert, delete) | Yes |
| `PowerShell` | Execute PowerShell commands natively (opt-in; auto on Windows without Git Bash) | Yes |
| `PushNotification` | Send desktop + phone push notification (Anthropic-hosted infra only) | No |
| `Read` | Read file contents with line numbers; handles images, PDFs, notebooks | No |
| `ReadMcpResourceTool` | Read a specific MCP resource by URI | No |
| `RemoteTrigger` | Create/run/list Routines on claude.ai (Pro/Max/Team/Enterprise only) | No |
| `ScheduleWakeup` | Self-schedule next `/loop` iteration (1 min–1 hour out) | No |
| `SendMessage` | Send to an agent team teammate or resume a subagent (experimental) | No |
| `ShareOnboardingGuide` | Upload ONBOARDING.md and return a share link | Yes |
| `Skill` | Execute a skill within the main conversation | Yes |
| `TaskCreate` | Create a task in the session task list | No |
| `TaskGet` | Get full details for a specific task | No |
| `TaskList` | List all tasks with status | No |
| `TaskOutput` | (Deprecated) Retrieve task output; prefer `Read` on task output path | No |
| `TaskStop` | Kill a running background task by ID | No |
| `TaskUpdate` | Update task status, dependencies, or delete tasks | No |
| `TodoWrite` | Manage session task checklist (disabled by default since v2.1.142; use Task* instead) | No |
| `ToolSearch` | Dynamically find and load deferred MCP tools on demand | No |
| `WaitForMcpServers` | Wait for connecting MCP servers (only when tool search is disabled) | No |
| `WebFetch` | Fetch URL, convert HTML→Markdown, run extraction prompt via small model (15-min cache) | Yes |
| `WebSearch` | Query Anthropic's web search backend; returns titles+URLs; up to 8 backend searches per call | Yes |
| `Workflow` | Run a dynamic workflow script that orchestrates subagents in the background | Yes |
| `Write` | Create or overwrite a file (requires prior Read if file exists) | Yes |

**Source:** https://code.claude.com/docs/en/tools-reference.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** `Edit` requires the file to have been Read (or viewed via `cat`/`head`/`tail`/`sed -n`/`grep`/`egrep`/`fgrep`) in the current conversation, and the file must not have changed on disk since that read. `old_string` must appear exactly once.  
**Detail:** The `replace_all: true` parameter can replace all occurrences. Piped bash output does not satisfy the read-before-edit requirement. Same applies to `Write` when overwriting an existing file.  
**Source:** https://code.claude.com/docs/en/tools-reference.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** `Bash` has a default 2-minute timeout (overridable up to 10 min per command with the `timeout` parameter); `BASH_DEFAULT_TIMEOUT_MS` and `BASH_MAX_TIMEOUT_MS` env vars override the defaults. Output is capped at 30,000 chars (raised via `BASH_MAX_OUTPUT_LENGTH`, hard ceiling 150,000).  
**Detail:** `cd` in the main session persists to later Bash commands as long as the target is within the project directory or an added directory. Environment variables do NOT persist across commands. Shell aliases from `~/.zshrc`/`~/.bashrc` are sourced at session start.  
**Source:** https://code.claude.com/docs/en/tools-reference.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** `Glob` does not respect `.gitignore` by default; `Grep` (built on ripgrep) does respect `.gitignore` by default.  
**Detail:** Set `CLAUDE_CODE_GLOB_NO_IGNORE=false` to make Glob respect `.gitignore`. Grep output modes: `files_with_matches` (default), `content`, `count`. Glob results sorted by mtime, capped at 100 files.  
**Source:** https://code.claude.com/docs/en/tools-reference.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** `WebFetch` is lossy by design — it runs an extraction prompt via a small fast model rather than returning raw page content to Claude. The extraction prompt determines what Claude receives.  
**Detail:** HTTP URLs auto-upgraded to HTTPS. Large pages truncated before processing. 15-minute cache. Cross-host redirects return redirect info instead of following (Claude must issue a second fetch). `User-Agent` header begins with `Claude-User`. Preapproved documentation domains fetch without permission prompts; others prompt first time per domain.  
**Source:** https://code.claude.com/docs/en/tools-reference.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** `WebSearch` may issue up to 8 backend searches per call, refining internally before returning results. It does NOT fetch pages — it returns titles and URLs only. Claude follows up with `WebFetch` to read pages.  
**Detail:** Results can be scoped with `allowed_domains` (include) or `blocked_domains` (exclude), but not both in a single call. Only available on Claude API and Microsoft Foundry; works on Vertex AI with Claude 4 models only; NOT available on Amazon Bedrock.  
**Source:** https://code.claude.com/docs/en/tools-reference.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** `LSP` provides code intelligence via language servers — jump to definition, find references, type errors/warnings, symbol search, implementation finding, call hierarchy. It requires a code intelligence plugin to be installed.  
**Detail:** After each file edit, `LSP` automatically reports type errors so Claude can fix issues without a separate build step. The plugin bundles language server configuration; the actual language server binary must be installed separately.  
**Source:** https://code.claude.com/docs/en/tools-reference.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** `Monitor` runs a command in the background and feeds each output line back to Claude as it arrives, enabling real-time reaction to logs, file changes, or CI status.  
**Detail:** Requires v2.1.98+. Uses same permission rules as `Bash`. Not available on Amazon Bedrock, Google Vertex AI, or Microsoft Foundry. Also unavailable when `DISABLE_TELEMETRY` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set. Plugins can declare monitors that start automatically.  
**Source:** https://code.claude.com/docs/en/tools-reference.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Tool permission rules use the format `ToolName(specifier)`. Specifiers per tool:
- `Bash(npm run *)` — command pattern (also applies to Monitor)
- `Read(~/secrets/**)` — path pattern (also applies to Grep, Glob, LSP)
- `Edit(/src/**)` — path pattern (also applies to Write, NotebookEdit)
- `Skill(deploy *)` — skill name pattern
- `Agent(Explore)` — subagent type
- `WebFetch(domain:example.com)` — domain matching
- `WebSearch` — no specifier; allow or deny entire tool

**Detail:** An `Edit(...)` allow rule implicitly grants read access to the same path. Hook `matcher` fields use bare tool names without parentheses.  
**Source:** https://code.claude.com/docs/en/tools-reference.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 3. Permissions & Modes

---

**Claim:** Claude Code has six permission modes: `default`, `acceptEdits`, `plan`, `dontAsk`, `auto`, `bypassPermissions`.  
**Detail:**
- **default**: Prompts for every potentially dangerous operation. Tools not covered by allow rules trigger approval callback; no callback = deny.
- **acceptEdits**: Auto-approves file edits and common filesystem commands (`mkdir`, `touch`, `mv`, `cp`); other Bash follows default rules.
- **plan**: Read-only exploration — file edits are never auto-approved, always prompt.
- **dontAsk**: Never prompts; tools pre-approved by permission rules run, everything else denied. Used for CI/CD.
- **auto** (TypeScript SDK only): Model classifier approves or denies each tool call. See auto-mode docs for availability.
- **bypassPermissions**: Skips all permission checks; cannot run as root on Unix. For isolated containers only.

**Source:** https://claudefa.st/blog/guide/development/permission-management; https://code.claude.com/docs/en/agent-sdk/agent-loop.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** `Shift+Tab` in the CLI cycles through `normal → acceptEdits → plan → normal`. Plan mode can also be toggled with `/plan`.  
**Detail:** The CLI flag `--dangerously-skip-permissions` activates `bypassPermissions` mode. Administrators can disable it via `disableAutoMode: "disable"` in managed settings.  
**Source:** https://claudefa.st/blog/guide/development/permission-management  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Permission rules live in `settings.json` under `permissions.allow` and `permissions.deny` arrays.  
**Detail:** Allow rules auto-approve matching tool calls. Deny rules block them entirely. Ask rules show a prompt. Deny takes precedence over allow when both match. CLI flags `--allowedTools` and `--disallowedTools` also accept the same rule format. Subagent `tools`/`disallowedTools` frontmatter, skill `allowed-tools` frontmatter, and hook `if` fields also use the same syntax.  
**Source:** https://code.claude.com/docs/en/tools-reference.md; https://code.claude.com/docs/en/settings.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Settings have a four-level scope hierarchy: Managed (highest) > CLI args > Local (`.claude/settings.local.json`) > Project (`.claude/settings.json`) > User (`~/.claude/settings.json`). Managed settings cannot be overridden.  
**Detail:** Managed settings are deployed via MDM or server configuration. `allowManagedPermissionRulesOnly: true` in managed settings prevents user/project from adding permission rules. `parentSettingsBehavior: "first-wins" | "merge"` controls how parent-supplied settings are merged (v2.1.133+).  
**Source:** https://code.claude.com/docs/en/settings.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 4. Complete Settings.json Key Reference

---

**Claim:** As of v2.1.183, Claude Code exposes 80+ settings keys and 200+ environment variables. The major settings categories and keys are:

**Model & Performance:**
- `model` (string) — default model
- `advisorModel` (string) — model for server-side advisor tool (v2.1.98+)
- `fallbackModel` (array, max 3) — fallback models when primary is overloaded
- `availableModels` (array) — restrict selectable models
- `enforceAvailableModels` (bool, default false) — constrain default to availableModels list (v2.1.175+)
- `modelOverrides` (object) — map Anthropic model IDs to provider-specific IDs (e.g., Bedrock ARNs)
- `effortLevel` (string, default "medium") — persist effort: `"low" | "medium" | "high" | "xhigh"`
- `alwaysThinkingEnabled` (bool, default false) — enable extended thinking by default

**Display & UI:**
- `outputStyle` (string) — output style (Default, Proactive, Explanatory, Learning, or custom)
- `editorMode` (string, default "normal") — `"normal" | "vim"` key bindings
- `autoScrollEnabled` (bool, default true) — follow new output in fullscreen rendering
- `prefersReducedMotion` (bool, default false) — reduce animations
- `axScreenReader` (bool, default false) — screen-reader friendly output (v2.1.181+)
- `language` (string) — preferred response language (e.g., `"japanese"`, `"spanish"`)
- `awaySummaryEnabled` (bool, default true) — session recap when returning

**File & Memory:**
- `autoMemoryEnabled` (bool, default true) — enable auto memory read/write
- `autoMemoryDirectory` (string, default `~/.claude/memory`) — custom memory directory
- `claudeMdExcludes` (array) — glob patterns to skip for CLAUDE.md files
- `fileCheckpointingEnabled` (bool, default true) — snapshot files before edits for `/rewind` (v2.1.119+)
- `respectGitignore` (bool, default true) — exclude gitignore patterns from `@` file picker
- `cleanupPeriodDays` (int, default 30, min 1) — delete session files older than X days
- `plansDirectory` (string, default `~/.claude/plans`) — custom directory for plan files

**Security & Permissions:**
- `permissions` (object) — allow/deny/ask rules for tools and files
- `allowManagedPermissionRulesOnly` (bool, default false) — prevent user/project permission rules
- `disableAutoMode` (string) — set to `"disable"` to prevent auto mode activation

**MCP Servers:**
- `allowedMcpServers` (array, Managed) — allowlist of MCP servers
- `deniedMcpServers` (array, Managed) — denylist of MCP servers (takes precedence)
- `allowManagedMcpServersOnly` (bool, default false) — only admin-defined servers
- `enabledMcpjsonServers` (array) — approve specific servers from `.mcp.json`
- `enableAllProjectMcpServers` (bool, default false) — auto-approve all project `.mcp.json` servers
- `disabledMcpjsonServers` (array) — reject specific servers
- `disableClaudeAiConnectors` (bool, default false) — disable claude.ai MCP connectors (v2.1.182+)

**Hooks:**
- `hooks` (object) — lifecycle event handlers
- `disableAllHooks` (bool, default false) — disable all hooks
- `allowManagedHooksOnly` (bool, default false, Managed) — only managed hooks
- `allowedHttpHookUrls` (array, Managed) — allowlist URL patterns for HTTP hooks

**Skills & Workflows:**
- `disableBundledSkills` (bool, default false, Managed) — remove bundled skills
- `disableSkillShellExecution` (bool, default false, Managed) — disable inline shell in skills
- `disableWorkflows` (bool, default false) — disable dynamic workflows
- `maxSkillDescriptionChars` (int, default 1536) — per-skill description character cap (v2.1.105+)

**Features:**
- `disableArtifact` (bool, default false, Managed) — disable Artifact tool
- `disableAgentView` (bool, default false, Managed) — disable background agents
- `disableRemoteControl` (bool, default false, Managed) — disable Remote Control (v2.1.128+)
- `agent` (string) — run as named subagent
- `agentPushNotifEnabled` (bool, default false) — allow proactive push notifications (v2.1.119+)
- `inputNeededNotifEnabled` (bool, default false) — push when actions required (v2.1.119+)
- `autoCompactEnabled` (bool, default true) — auto-compact near context limit (v2.1.119+)
- `fastModePerSessionOptIn` (bool, default false) — require per-session opt-in for fast mode

**Authentication:**
- `apiKeyHelper` (string) — script to generate auth value
- `forceLoginMethod` (string, Managed) — `"claudeai" | "console"`
- `forceLoginOrgUUID` (string|array, Managed) — require login to specific org(s)
- `awsCredentialExport` (string) — script outputting AWS credentials JSON
- `awsAuthRefresh` (string) — script modifying `.aws` directory
- `gcpAuthRefresh` (string) — script refreshing GCP Application Default Credentials

**Notifications & Remote:**
- `preferredNotifChannel` (string, default "auto") — `"auto" | "terminal_bell" | "iterm2" | "kitty" | "ghostty" | "notifications_disabled"`
- `remoteControlAtStartup` (bool) — auto-connect Remote Control on start (v2.1.119+)

**Git & Attribution:**
- `attribution` (object) — customize git commit/PR attribution
- `includeCoAuthoredBy` (bool, default true) — DEPRECATED; use `attribution`
- `includeGitInstructions` (bool, default true) — include built-in git workflow instructions
- `prUrlTemplate` (string) — URL template with `{host}`, `{owner}`, `{repo}`, `{number}`, `{url}`

**Version Control:**
- `autoUpdatesChannel` (string, default "latest") — `"stable"` (1 week old) or `"latest"`
- `minimumVersion` (string) — floor version
- `requiredMinimumVersion` (string, Managed) — minimum required; blocks startup if older
- `requiredMaximumVersion` (string, Managed) — maximum allowed; blocks startup if newer

**Organization:**
- `companyAnnouncements` (array, Managed) — startup announcements (cycled randomly)
- `claudeMd` (string, Managed) — org-wide CLAUDE.md instructions
- `parentSettingsBehavior` (string, default "first-wins", Managed) — `"first-wins" | "merge"` (v2.1.133+)
- `policyHelper` (object, Managed) — executable for dynamic managed settings (v2.1.136+)

**Env:**
- `env` (object) — key/value pairs injected into session environment at startup

**Source:** https://code.claude.com/docs/en/settings.md; https://claudefa.st/blog/guide/settings-reference  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Key environment variables (beyond `env` in settings.json):

| Env Var | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | API key for authentication |
| `ANTHROPIC_AUTH_TOKEN` | Auth token |
| `ANTHROPIC_MODEL` | Override default model for one session |
| `CLAUDE_CODE_ENABLE_TELEMETRY` | Enable telemetry (`1` or `0`) |
| `MAX_THINKING_TOKENS` | Set to `0` to disable extended thinking |
| `DISABLE_AUTOUPDATER` | Disable auto-updates |
| `DISABLE_TELEMETRY` | Disable telemetry |
| `DISABLE_AUTO_COMPACT` | Disable auto-compact |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | Disable auto memory |
| `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING` | Disable file checkpointing |
| `BASH_DEFAULT_TIMEOUT_MS` | Override Bash default timeout |
| `BASH_MAX_TIMEOUT_MS` | Override Bash maximum timeout |
| `BASH_MAX_OUTPUT_LENGTH` | Override Bash output char limit |
| `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR` | Disable `cd` carry-over between Bash calls (`=1`) |
| `CLAUDE_ENV_FILE` | Shell script for persistent env vars across Bash commands |
| `CLAUDE_CODE_DISABLE_WORKFLOWS` | Disable dynamic workflows |
| `CLAUDE_CODE_DISABLE_BUNDLED_SKILLS` | Disable bundled skills |
| `CLAUDE_CODE_EFFORT_LEVEL` | Set effort level (overrides `effortLevel` setting) |
| `CLAUDE_CODE_USE_POWERSHELL_TOOL` | Enable PowerShell tool (`=1`) |
| `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS` | Remove built-in subagents in SDK (`=1`) |
| `CLAUDE_CODE_GLOB_NO_IGNORE` | Make Glob respect gitignore (`=false`) |
| `CLAUDE_AX_SCREEN_READER` | Enable screen-reader mode (v2.1.181+) |
| `CLAUDE_CODE_SKIP_PROMPT_HISTORY` | Disable transcript writes |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | Disable telemetry + Monitor tool |
| `OTEL_METRICS_EXPORTER` | OpenTelemetry metrics exporter |
| `NO_COLOR` | Disable color output (passed to subprocesses, v2.1.143+) |
| `FORCE_COLOR` | Force color output (v2.1.143+) |
| `CLAUDE_CODE_ENABLE_TASKS` | Set to `0` to re-enable legacy `TodoWrite` instead of Task* tools |

**Source:** https://code.claude.com/docs/en/settings.md; https://code.claude.com/docs/en/env-vars.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 5. Hooks

---

**Claim:** Claude Code supports 30 named hook events, organized into session, prompt, tool, subagent/task, file/config, and notification phases.

**Complete event list:**

| Event | Phase | Blockable | When it fires |
|---|---|---|---|
| `SessionStart` | Session | No | New session, resume, clear, or compact |
| `Setup` | Session | No | `--init` or `--maintenance` invocation |
| `SessionEnd` | Session | No | Session terminates |
| `UserPromptSubmit` | Prompt | Yes (exit 2) | Before Claude processes user prompt |
| `UserPromptExpansion` | Prompt | No | Command expands into a prompt |
| `Stop` | Prompt | Yes (exit 2) | Claude finishes responding |
| `StopFailure` | Prompt | No | Turn ends due to API error |
| `PreToolUse` | Tool | Yes (exit 2) | Before any tool executes |
| `PostToolUse` | Tool | No (can inject context) | After tool succeeds |
| `PostToolUseFailure` | Tool | No | After tool fails |
| `PostToolBatch` | Tool | No | All tools in parallel batch resolve (TypeScript SDK only) |
| `PermissionRequest` | Tool | Yes (exit 2) | Permission dialog would be shown |
| `PermissionDenied` | Tool | No | Tool call auto-denied |
| `SubagentStart` | Agent | No | Subagent spawning |
| `SubagentStop` | Agent | Yes (exit 2) | Subagent completes |
| `TaskCreated` | Agent | No | Background task created |
| `TaskCompleted` | Agent | No | Background task completes |
| `TeammateIdle` | Agent | No | Teammate becomes idle |
| `FileChanged` | File | No | Watched file changes on disk |
| `CwdChanged` | Config | No | Working directory changes |
| `ConfigChange` | Config | No | Configuration file changes |
| `InstructionsLoaded` | Config | No | CLAUDE.md or rules file loaded |
| `WorktreeCreate` | Config | No | Git worktree created |
| `WorktreeRemove` | Config | No | Git worktree removed |
| `Notification` | Notify | No | Agent status messages (permission_prompt, idle_prompt, auth_success, elicitation_*) |
| `MessageDisplay` | Notify | No | Assistant message with text completes (TypeScript only) |
| `PreCompact` | Context | No | Before conversation compaction |
| `PostCompact` | Context | No | After compaction completes |
| `Elicitation` | Input | No | User-prompt elicitation starts |
| `ElicitationResult` | Input | No | Elicitation response received |

**Source:** https://code.claude.com/docs/en/agent-sdk/hooks.md; https://www.morphllm.com/claude-code-hooks; https://claudefa.st/blog/tools/hooks/hooks-guide  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Hooks are configured in `settings.json` under the `hooks` key. Shell command hooks use the `type: "command"` format; SDK hooks use callback functions passed via `options.hooks`.  
**Detail:** Shell command hook example:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/script.sh",
            "timeout": 30,
            "if": "Bash(rm *)",
            "shell": "bash"
          }
        ]
      }
    ]
  }
}
```
Hooks can also be in `.claude/settings.json` (project, shared), `.claude/settings.local.json` (local, gitignored), plugin `hooks/hooks.json`, skill/agent frontmatter, or managed settings.  
**Source:** https://code.claude.com/docs/en/hooks.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Shell hook exit code semantics: exit 0 = success (parse stdout for JSON), exit 2 = blocking error (stop action, use stderr as error message), other = non-blocking (show stderr but continue).  
**Detail:** On `PreToolUse`, exit 2 blocks the tool call. On `UserPromptSubmit`, exit 2 rejects the prompt. On `PermissionRequest`, exit 2 denies. On `PostToolUse`, exit 2 shows stderr only (tool already ran). On `SessionStart`/`SessionEnd`, exit 2 shows stderr only.  
**Source:** https://code.claude.com/docs/en/hooks.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Hook JSON output (when exit 0) supports universal fields (`continue`, `stopReason`, `suppressOutput`, `systemMessage`, `terminalSequence`) and event-specific `hookSpecificOutput` fields.  
**Detail:**
- `PreToolUse` hookSpecificOutput: `permissionDecision` (allow|deny|ask|defer), `permissionDecisionReason`, `updatedInput` (to modify tool input), `additionalContext`
- `PostToolUse` hookSpecificOutput: `additionalContext`, `updatedToolOutput` (replace tool output before Claude sees it)
- `Stop` hookSpecificOutput: `additionalContext` (continues conversation), `decision: "block"` + `reason` (stops Claude)
- `SessionStart` hookSpecificOutput: `additionalContext`, `sessionTitle`, `initialUserMessage`, `watchPaths`, `reloadSkills`
- When multiple hooks conflict on permission: **deny** > **defer** > **ask** > **allow**

**Source:** https://code.claude.com/docs/en/hooks.md; https://code.claude.com/docs/en/agent-sdk/hooks.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Hook matcher patterns follow a 3-way rule: `"*"` or empty or omitted = match all; letters/digits/underscore/pipe only = exact string or pipe-separated list; any other character = JavaScript regex.  
**Detail:** MCP tools always named `mcp__<server>__<action>`. Pattern `^mcp__` (contains `^`, treated as regex) matches all MCP tools. Pattern `mcp__memory__create_entities` (letters+underscores only) is an exact string match. Pattern `mcp__memory__.*` (contains `.` and `*`, treated as regex) matches all memory server tools. The `if` condition field uses permission rule syntax (`Bash(git *)`) and only evaluates on tool events.  
**Source:** https://code.claude.com/docs/en/agent-sdk/hooks.md; https://code.claude.com/docs/en/hooks.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Hook callbacks in the SDK receive: input data (typed per event, always containing `session_id`, `cwd`, `hook_event_name`), a `tool_use_id` string (correlates Pre/Post pairs), and a context object (TypeScript: `signal: AbortSignal`; Python: reserved).  
**Detail:** Default hook timeout is 60 seconds in SDK (600 seconds for shell command hooks). Set `async: true` (or `async_: True` in Python) to fire-and-forget side effects without blocking the agent. Multiple hooks on the same event run in parallel; the most restrictive result wins.  
**Source:** https://code.claude.com/docs/en/agent-sdk/hooks.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Environment variables available to shell hooks: `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `CLAUDE_EFFORT`, `CLAUDE_ENV_FILE`, `CLAUDE_CODE_REMOTE`.  
**Detail:** `CLAUDE_ENV_FILE` is special: if a `SessionStart`, `Setup`, `CwdChanged`, or `FileChanged` hook writes `KEY=value` lines to this file, those variables persist across Bash commands for the session. Hooks that run `source`-style environment setup should use this file.  
**Source:** https://code.claude.com/docs/en/hooks.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 6. Slash Commands

---

**Claim:** Built-in slash commands discovered via `system/init` message `slash_commands` field. `/help` shows all available commands including bundled skills, custom commands/skills, and MCP server prompts.  
**Detail:** Only commands that work without an interactive terminal are dispatchable through the SDK. The init message lists available commands as an array of strings (e.g., `["clear", "compact", "context", "usage"]`). Custom commands/skills appear alongside built-ins.  
**Source:** https://code.claude.com/docs/en/agent-sdk/slash-commands.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Core built-in slash commands include (non-exhaustive): `/help`, `/clear`, `/compact`, `/context`, `/usage`, `/plan`, `/model`, `/config`, `/permissions`, `/mcp`, `/memory`, `/tasks`, `/workflows`, `/agents`, `/skills`, `/add-dir`, `/doctor`, `/cd`, `/effort`, `/goal`, `/loop`, `/schedule`, `/deep-research`, `/code-review`, `/debug`, `/run`, `/verify`, `/batch`, `/rewind`, `/statusline`, `/keybindings`.

**Detail:**
- `/clear`: Reset conversation to empty context (v2.1.117+ in SDK)
- `/compact`: Compact conversation history; emits `compact_boundary` message
- `/effort <level>`: Set effort for session (`low|medium|high|xhigh|max|ultracode`)
- `/goal <condition>`: Register a session-level completion condition; Claude keeps working until met
- `/loop [interval]`: Run a prompt or skill on a recurring interval
- `/workflows`: View running and completed dynamic workflow runs (v2.1.154+)
- `/agents`: Manage subagents (running tab + library tab with create/edit/delete)
- `/cd <path>`: Switch directory while preserving prompt cache (v2.1.169+)
- `/rewind`: Restore files to pre-edit state using file checkpoints (v2.1.119+)
- `/deep-research <question>`: Bundled workflow — fan out web searches, cross-check, synthesize cited report

**Source:** https://code.claude.com/docs/en/agent-sdk/slash-commands.md; https://www.explainx.ai/blog/claude-code-commands-complete-reference-guide-2026; https://aiopsschool.com/blog/the-master-tutorial-every-claude-code-slash-command-explained-april-2026-edition/  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Custom slash commands are created as Markdown files in `.claude/commands/<name>.md` (project) or `~/.claude/commands/<name>.md` (personal). The recommended format since v2.1.x is `.claude/skills/<name>/SKILL.md` — both formats work identically as slash commands.  
**Detail:** Custom command frontmatter supports: `description`, `allowed-tools`, `argument-hint`, `model`. Placeholder `$0`, `$1`, etc. for arguments; `$ARGUMENTS` for the whole argument string. Commands can include `!`-prefixed bash commands (executed at load time, output inlined) and `@file-path` references (file content inlined). Subdirectory organization is supported.  
**Source:** https://code.claude.com/docs/en/agent-sdk/slash-commands.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 7. Subagents

---

**Claim:** Built-in subagents: `Explore` (Haiku, read-only, fast codebase search), `Plan` (inherits model, read-only, codebase research for plan mode), `general-purpose` (inherits model, all tools), `statusline-setup` (Sonnet, for `/statusline`), `claude-code-guide` (Haiku, answers Claude Code feature questions).  
**Detail:** Explore and Plan skip CLAUDE.md files and git status to keep research fast. All other built-ins and custom subagents load CLAUDE.md. In non-interactive mode and Agent SDK, set `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS=1` to suppress all built-ins.  
**Source:** https://code.claude.com/docs/en/sub-agents.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Custom subagents are defined in Markdown files with YAML frontmatter stored in priority order: Managed settings (org-wide, priority 1) > `--agents` CLI flag (session-only, priority 2) > `.claude/agents/` (project, priority 3) > `~/.claude/agents/` (user, priority 4) > plugin `agents/` directory (priority 5).  
**Detail:** The `/agents` command provides a tabbed interface (Running tab, Library tab) for managing subagents. Subagents can also be generated with Claude via the interface or defined as JSON via `--agents` CLI flag.  
**Source:** https://code.claude.com/docs/en/sub-agents.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Subagent YAML frontmatter supported fields include: `name`, `description`, `model`, `tools` (list of allowed tools), `disallowedTools`, `prompt` (system prompt), `isolation` (`worktree` | `none`), `maxTurns`, `color`, `memory` (`user` | none), `hooks`, `skills`, and more.  
**Detail:** Tool inheritance rules: neither field set = inherit all parent tools; `tools` only = listed tools only; `disallowedTools` only = all parent tools except listed; both set = `disallowedTools` takes precedence. Foreground subagents show permission prompts; background subagents auto-deny unapproved tool calls and keep running.  
**Source:** https://code.claude.com/docs/en/sub-agents.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Forked subagents inherit the full parent conversation (instead of starting fresh), always run in the background, and surface permission prompts in the parent terminal. The `Agent` tool also supports a fork mode.  
**Detail:** Named subagents (most common) start with a fresh context containing only their own system prompt + relevant configuration. Subagents preserve context isolation: only the final summary returns to the parent, not intermediate tool outputs.  
**Source:** https://code.claude.com/docs/en/sub-agents.md; https://code.claude.com/docs/en/tools-reference.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 8. Skills

---

**Claim:** Skills are Markdown files (`SKILL.md`) with YAML frontmatter that extend Claude's capabilities. They differ from CLAUDE.md in that skill body content loads only when invoked (lazy), not on every request.  
**Detail:** Skills follow the [Agent Skills open standard](https://agentskills.io) which works across multiple AI tools. Claude Code extends the standard with invocation control, subagent execution, and dynamic context injection. Skills are stored in: enterprise managed > personal (`~/.claude/skills/<name>/SKILL.md`) > project (`.claude/skills/<name>/SKILL.md`) > plugin skills.  
**Source:** https://code.claude.com/docs/en/skills.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Skills support dynamic context injection via `!`-prefixed bash commands in SKILL.md. Claude Code runs the command and replaces the line with its output before Claude sees the skill content.  
**Detail:** Example: `` !`git diff HEAD` `` is replaced inline with the actual diff. This enables skills to deliver live data (current diff, environment state, test results) without Claude having to run a separate tool call first.  
**Source:** https://code.claude.com/docs/en/skills.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Skill YAML frontmatter fields include: `name`, `description`, `allowed-tools`, `argument-hint`, `model`, `context` (`fork` for subagent execution), `disable-model-invocation` (prevents Claude from auto-triggering), `shell` (`bash` | `powershell`), and `force-for-plugin` (output-styles only).  
**Detail:** `disable-model-invocation: true` makes a skill manual-only (must type `/skill-name`). `context: fork` runs the skill in a subagent. Claude auto-invokes skills when the task description matches the skill's `description` field.  
**Source:** https://code.claude.com/docs/en/skills.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Bundled skills (pre-installed, cannot be removed unless `disableBundledSkills: true`) include: `/code-review`, `/batch`, `/debug`, `/loop`, `/claude-api`, `/run`, `/verify`, `/run-skill-generator`, and `/deep-research` (workflow).  
**Detail:** `/run` and `/verify` infer project launch from README/package.json/Makefile; use `/run-skill-generator` to record a custom launch recipe. Bundled skills are listed in the commands reference and marked "Skill" in Purpose column. A project skill with the same name overrides a bundled skill.  
**Source:** https://code.claude.com/docs/en/skills.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Claude Code watches skill directories for live changes within a session. Adding, editing, or removing a skill in `~/.claude/skills/`, `.claude/skills/`, or an `--add-dir` `.claude/skills/` takes effect without restarting.  
**Detail:** Exception: creating a brand new top-level skills directory requires a restart for the watch to be set up. Skills also load from nested `.claude/skills/` directories as Claude works with files in subdirectories (monorepo support). Skill names from nested dirs are directory-qualified: `apps/web:deploy`.  
**Source:** https://code.claude.com/docs/en/skills.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 9. Output Styles

---

**Claim:** Claude Code has four built-in output styles: `Default`, `Proactive`, `Explanatory`, `Learning`.  
**Detail:**
- **Default**: Built-in software engineering instructions (the baseline system prompt).
- **Proactive**: Executes immediately, makes reasonable assumptions, prefers action over planning. Stronger than auto mode — does NOT change permission mode (you still see prompts).
- **Explanatory**: Provides educational "Insights" between engineering tasks; explains choices and patterns.
- **Learning**: Collaborative mode — shares Insights AND adds `TODO(human)` markers for human code contribution. Learn-by-doing.

**Source:** https://code.claude.com/docs/en/output-styles.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Custom output styles are Markdown files in `~/.claude/output-styles/` (user), `.claude/output-styles/` (project), or managed policy directory. The filename (without `.md`) becomes the style name unless a `name` frontmatter field overrides it.  
**Detail:** Frontmatter fields for output styles: `name`, `description`, `keep-coding-instructions` (bool, default false — keep Claude Code's built-in engineering instructions), `force-for-plugin` (bool, auto-applies style when plugin is enabled). Set `outputStyle` key in settings.json to activate. Changed via `/config` → Output style. Takes effect after `/clear` or a new session. Output styles modify the system prompt directly.  
**Source:** https://code.claude.com/docs/en/output-styles.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** The standalone `/output-style` command was deprecated in v2.1.73 and removed in v2.1.91. Use `/config` instead.  
**Source:** https://code.claude.com/docs/en/output-styles.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 10. Workflows (Dynamic)

---

**Claim:** Dynamic workflows are JavaScript scripts that orchestrate many subagents at scale. The `Workflow` tool runs them. Claude Code writes the script for the described task; the runtime executes it in the background.  
**Detail:** Workflows move orchestration into code (not Claude's context window). Intermediate results stay in script variables. Up to 16 concurrent agents (fewer on low-CPU machines); 1,000 agents total per run. No mid-run user input possible (only permission prompts can pause). No direct filesystem/shell access from the script itself — agents do that.  
**Source:** https://code.claude.com/docs/en/workflows.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Workflow triggers: include `ultracode` keyword in prompt (or ask in natural language "use a workflow"), or set `/effort ultracode` for the session (Claude auto-plans workflows for every substantive task).  
**Detail:** `ultracode` = `xhigh` reasoning effort + automatic workflow orchestration. Press `Option+W` (macOS) or `Alt+W` (Win/Linux) to dismiss the trigger for a single prompt. `/config` toggle "Ultracode keyword trigger" to disable permanently. Before v2.1.160, the literal keyword `workflow` was the trigger; natural language works from v2.1.160+.  
**Source:** https://code.claude.com/docs/en/workflows.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Saved workflows are stored in `.claude/workflows/` (project-shared) or `~/.claude/workflows/` (personal). They become slash commands (`/<name>`). The bundled `/deep-research` workflow is always available.  
**Detail:** In monorepos (v2.1.178+), saving writes to the closest `.claude/workflows/` between cwd and repo root. Project workflows load from every `.claude/workflows/` along the path; the closest-to-cwd definition wins on name conflicts. Workflows can accept a structured `args` global parameter — passed by Claude from natural language invocation, no parsing needed.  
**Source:** https://code.claude.com/docs/en/workflows.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Workflow permission behavior: per-run approval prompt shown in `default` and `acceptEdits` modes; `auto` mode prompts on first launch only (subsequent launches are silent); `bypassPermissions`/`claude -p`/SDK skip prompts entirely. The spawned subagents always run in `acceptEdits` mode regardless of session mode.  
**Detail:** File edits within a workflow are auto-approved. Shell commands, web fetches, and MCP tools not in allowlist can still prompt mid-run. Pre-add needed commands to allowlist before long runs to prevent interruption. `/workflows` command shows running and completed runs; press `p` to pause/resume, `x` to stop, `r` to restart agent, `s` to save.  
**Source:** https://code.claude.com/docs/en/workflows.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 11. Agent SDK (Python & TypeScript)

---

**Claim:** The Claude Agent SDK (`@anthropic-ai/claude-agent-sdk` for TypeScript, `claude-agent-sdk` for Python) embeds the Claude Code agent loop in applications without needing the CLI installed.  
**Detail:** The SDK provides: built-in tools (Read, Edit, Write, Glob, Grep, Bash, WebSearch, WebFetch, ToolSearch, Agent, Skill, AskUserQuestion, TaskCreate, TaskUpdate), MCP server connection, custom tool handlers, hook callbacks, session management (resume, fork, continue), streaming output, structured output, cost tracking (OpenTelemetry), and permission control.  
**Source:** https://code.claude.com/docs/en/agent-sdk/overview.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** The `query()` function is the primary SDK entry point (TypeScript async iterator; Python async generator). Options include: `prompt`, `model`, `maxTurns`, `maxBudgetUsd`, `effort`, `permissionMode`, `allowedTools`, `disallowedTools`, `settingSources`, `hooks`, `mcpServers`, and more.  
**Detail:** `settingSources: ["project"]` loads `.claude/settings.json` (including hooks, CLAUDE.md, and skills) from the current directory. Without this, SDK runs with no project context. TypeScript also has a `ClaudeSDKClient` class for multi-turn streaming sessions; Python uses `ClaudeSDKClient` for automatic session ID tracking across calls.  
**Source:** https://code.claude.com/docs/en/agent-sdk/typescript.md; https://code.claude.com/docs/en/agent-sdk/python.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** SDK hooks are configured via `options.hooks` as a dictionary of event name → array of `{matcher, hooks: [callback]}` objects (TypeScript) or `HookMatcher` objects (Python).  
**Detail:** SDK callback hooks run in the application process, not in Claude's context window (no token cost). Python SDK does NOT support `SessionStart` and `SessionEnd` as callback hooks (TypeScript-only); use shell command hooks via `setting_sources` instead. `PostToolBatch`, `MessageDisplay`, `ConfigChange`, `WorktreeCreate`, `WorktreeRemove`, `TeammateIdle`, `TaskCompleted` are TypeScript-only SDK hooks.  
**Source:** https://code.claude.com/docs/en/agent-sdk/hooks.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 12. CLAUDE.md and Memory

---

**Claim:** `CLAUDE.md` files are automatically loaded into every Claude Code session as project context. They live at project root (`.`) and parent directories up to the git root. Personal instructions go in `~/.claude/CLAUDE.md`.  
**Detail:** CLAUDE.md content is injected as a user message after the system prompt, not as part of the system prompt itself. It is re-injected on every request (prompt-cached after the first). Content grows the context window proportionally. For procedures and workflows, use Skills instead (lazy load).  
**Source:** https://code.claude.com/docs/en/memory.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

**Claim:** Auto-memory (`autoMemoryEnabled: true` by default) allows Claude to read and write structured facts to `~/.claude/memory/` (or custom `autoMemoryDirectory`) across sessions.  
**Detail:** Memory is keyed by file within the memory directory. Claude reads relevant memory files at session start and writes updated facts as it learns them. Disable with `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` or `autoMemoryEnabled: false`.  
**Source:** https://code.claude.com/docs/en/settings.md; https://code.claude.com/docs/en/memory.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 13. Key Feature Versions (Timeline)

---

**Claim:** Notable feature introduction versions for Claude Code:

| Feature | Version |
|---|---|
| File checkpointing + `/rewind` | v2.1.119 |
| Push notifications | v2.1.119 |
| Auto-compact | v2.1.119 |
| Remote Control | v2.1.119 |
| `/clear` in SDK | v2.1.117 |
| Per-skill description char cap (`maxSkillDescriptionChars`) | v2.1.105 |
| Advisor model | v2.1.98 |
| Monitor tool | v2.1.98 |
| TodoWrite disabled by default; Task* tools replace | v2.1.142 |
| `WaitForMcpServers` + `TodoWrite` min-version marker | v2.1.142 |
| `/run`, `/verify`, `/run-skill-generator` | v2.1.145 |
| Dynamic workflows (`/workflows`) | v2.1.154 |
| Natural-language workflow trigger (not just keyword) | v2.1.160 |
| `parentSettingsBehavior: merge` | v2.1.133 |
| `policyHelper` (dynamic managed settings) | v2.1.136 |
| `remoteControlAtStartup`, file checkpointing, agentPushNotif | v2.1.119 |
| `enforceAvailableModels` | v2.1.175 |
| Footer link badges (`footerLinksRegexes`) | v2.1.176 |
| Monorepo nested `.claude/` directories support | v2.1.178 |
| Screen reader mode (`axScreenReader`) | v2.1.181 |
| `disableClaudeAiConnectors` | v2.1.182 |
| Effort level `xhigh` | v2.1.111 |

**Source:** https://code.claude.com/docs/en/settings.md; https://code.claude.com/docs/en/skills.md; https://code.claude.com/docs/en/workflows.md; https://code.claude.com/docs/en/changelog.md  
**last_verified:** 2026-06-21  
**Confidence:** med (version numbers sourced from inline doc annotations, not always explicitly stated in changelogs)

---

## 14. MCP Integration

---

**Claim:** MCP (Model Context Protocol) servers are connected via `.mcp.json` files in the project or configured in `settings.json` under `mcpServers`. MCP tools appear as `mcp__<server>__<action>` in permission rules and hook matchers.  
**Detail:** `ToolSearch` tool enables deferred loading of MCP tool schemas — they are not loaded upfront, reducing context overhead. On Vertex AI or non-first-party `ANTHROPIC_BASE_URL`, tool search is disabled and all MCP schemas load on every request. `enableAllProjectMcpServers: true` auto-approves all project `.mcp.json` servers. Managed settings can allowlist/denylist servers org-wide.  
**Source:** https://code.claude.com/docs/en/mcp.md; https://code.claude.com/docs/en/agent-sdk/agent-loop.md  
**last_verified:** 2026-06-21  
**Confidence:** high

---

## 15. Sandboxing

---

**Claim:** Claude Code supports a sandboxed Bash tool that confines shell commands to a restricted environment. Configured separately from permission rules; sandbox network rules require explicit permissions for domain access even if WebFetch allows the domain.  
**Detail:** Sandbox is described in `docs/en/sandboxing.md`. Not available on Windows (PowerShell tool preview). OS-level enforcement covers every process, including indirect file access from Python/Node scripts — unlike `Edit` deny rules which only cover recognized bash commands.  
**Source:** https://code.claude.com/docs/en/tools-reference.md; https://code.claude.com/docs/en/sandboxing.md  
**last_verified:** 2026-06-21  
**Confidence:** med (sandboxing doc not directly fetched; inferred from tools-reference mentions)

---

## Sources Summary

| Source | URL | Role |
|---|---|---|
| Claude Code official docs index | https://code.claude.com/docs/llms.txt | Primary — 149 pages |
| Tools reference | https://code.claude.com/docs/en/tools-reference.md | Complete tool list |
| Agent loop | https://code.claude.com/docs/en/agent-sdk/agent-loop.md | Loop mechanics |
| Settings reference | https://code.claude.com/docs/en/settings.md | All settings keys |
| Hooks reference | https://code.claude.com/docs/en/hooks.md | Shell hooks + all events |
| Agent SDK hooks | https://code.claude.com/docs/en/agent-sdk/hooks.md | SDK callback hooks |
| Output styles | https://code.claude.com/docs/en/output-styles.md | Output style system |
| Skills | https://code.claude.com/docs/en/skills.md | Skills system |
| Sub-agents | https://code.claude.com/docs/en/sub-agents.md | Subagent system |
| Workflows | https://code.claude.com/docs/en/workflows.md | Dynamic workflows |
| Slash commands SDK | https://code.claude.com/docs/en/agent-sdk/slash-commands.md | SDK slash commands |
| Permissions guide | https://claudefa.st/blog/guide/development/permission-management | Permission modes |
| Hooks guide (morphllm) | https://www.morphllm.com/claude-code-hooks | Hook events reference |
| Settings reference (claudefa.st) | https://claudefa.st/blog/guide/settings-reference | Settings cross-check |
| Commands reference | https://www.explainx.ai/blog/claude-code-commands-complete-reference-guide-2026 | Slash commands |
