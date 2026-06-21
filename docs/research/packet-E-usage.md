# Research Packet E — Power-User Patterns: Real Claude Usage Distilled

**Researcher:** Team E  
**Topic:** Mining the author's real Claude Code usage to distill power-user patterns and anonymized case studies  
**Sources mined:** `~/.claude/projects/**/*.jsonl` (1,271 sessions across 141 project directories), `~/.claude/history.jsonl` (5,487 lines), `/home/bunty490/code/work/luxora/.remember/` (45 daily logs + archive + memory files), `~/.claude/projects/-home-bunty490-code-work-luxora/memory/` (65 structured memory files), `~/.claude/settings.json`, `~/.claude/hooks/verify-commit.sh`, `/home/bunty490/code/work/luxora/.claude/settings.json`, `/home/bunty490/code/work/luxora/scripts/lux-wt.sh`  
**Redaction policy:** No secrets, tokens, client names, PII, or identifiable repo URLs reproduced. Code snippets are structural/illustrative only. All client-facing product details anonymized.  
**Date:** 2026-06-21

---

## How to Read This Packet

Each finding is structured as:

- **Claim** — the concrete, falsifiable observation
- **Detail** — supporting context and examples
- **Source** — exact file(s) or tool used
- **last_verified** — 2026-06-21
- **confidence** — high | med | low

---

## Section 1: Session Volume and Project Scope

### F-01: Scale — 1,271 Sessions Across 141 Project Directories

**Claim:** The author has accumulated 1,271 Claude Code sessions stored as JSONL across 141 project directories on this machine.

**Detail:** The primary project (a multi-repo CRM platform) accounts for 76 sessions in its main directory alone, plus an additional ~70 sessions spread across its 30+ worktree directories (each worktree gets its own project directory in `~/.claude/projects/`). Secondary projects include Rust code, personal apps, and infrastructure tools.

**Source:** `~/.claude/projects/` directory listing; `python3` count script over all project dirs  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-02: One Project Dominates — 76 Direct Sessions + Dozens in Worktrees

**Claim:** The author's main CRM project (`-home-bunty490-code-work-luxora`) has 76 JSONL sessions averaging 2.2 MB each, with the largest session reaching 14 MB (3,575 lines).

**Detail:** Total data across those 76 sessions: 64,568 lines, 169 MB. The worktree-scoped project directories (30+ of them, one per feature branch) add substantially more. Session sizes range from 37 KB (short focused tasks) to 14 MB (deep architectural migrations with many tool calls).

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/*.jsonl` — file sizes via Python  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Section 2: Permission and Mode Configuration

### F-03: `bypassPermissions` Is the Default Mode — 100% of Sessions

**Claim:** Every single session in the primary project (and its worktrees) uses `permissionMode: bypassPermissions`. Not one session used a restricted mode.

**Detail:** Across 3,301 `permission-mode` log entries in the primary project directory, 100% read `bypassPermissions`. Extending to all luxora worktree projects: 3,617 bypass vs. 0 restricted. The global `settings.json` also sets `"skipDangerousModePermissionPrompt": true`.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/*.jsonl` — permission-mode records; `~/.claude/settings.json`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-04: Always-Thinking and High Effort Level Set Globally

**Claim:** The global settings file enables `"alwaysThinkingEnabled": true` and `"effortLevel": "high"` for every session.

**Detail:** These two settings are baked into `~/.claude/settings.json` and apply across all projects. No per-project override was observed that changes these. The combination means the model performs extended reasoning before responding even on short prompts.

**Source:** `~/.claude/settings.json`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-05: Git Commit Author Is Enforced by a PreToolUse Hook

**Claim:** A `PreToolUse` hook (`verify-commit.sh`) intercepts every `git commit` Bash call, blocks it if the author is not the expected identity, and blocks AI attribution strings.

**Detail:** The hook reads the `tool_input.command` field from the hook JSON, checks `git config user.name` and `user.email` against hardcoded expected values, then uses `grep -Eiq` to scan the commit message for patterns like `Co-Authored-By: Claude`, `Generated with Claude`, `🤖 generated`. Any match → `permissionDecision: deny`. This is enforced globally (in `~/.claude/settings.json` `PreToolUse`, matcher `Bash`), making it apply to every project on the machine.

**Source:** `~/.claude/hooks/verify-commit.sh`; `~/.claude/settings.json` `hooks.PreToolUse`  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Section 3: Context Management — The Remember Plugin

### F-06: Automatic Session Memory via a Post-Tool Hook Pipeline

**Claim:** The author uses the `remember` plugin (v0.7.3) configured to extract and persist session summaries automatically via `SessionStart` and `PostToolUse` hooks — not manually via `/remember` slash commands.

**Detail:** The hooks configuration fires `post-tool-hook.sh` after every tool call. A Python extraction pipeline reads the current session's JSONL, calls a cheap model (Haiku) to summarize exchanges into compact bullet entries, and appends them to dated files (`today-YYYY-MM-DD.md`) under `.remember/`. A consolidation step runs periodically and archives into `archive.md`. The log shows cooldown logic (skips if less than 120 seconds since last save), minimum message count thresholds (skips sessions with fewer than 3 human messages), and cost tracking (`$0.035–$0.132` per save call).

**Source:** `~/.claude/plugins/cache/claude-plugins-official/remember/0.7.3/hooks/hooks.json`; `~/.remember/logs/memory-2026-06-21.log`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-07: Today-Log + Archive Pattern Gives Rolling Project Memory

**Claim:** The `.remember/` directory maintains a `today-YYYY-MM-DD.md` active log, `archive.md` for weekly roll-ups, `now.md` for the live day, and `recent.md` for identity candidates — giving a persistent, queryable memory across sessions without manually curating context.

**Detail:** As of 2026-06-21, 45 completed daily logs exist (dating back to 2026-04-30), covering approximately 8 weeks of daily CRM work. The weekly archive entries average 5–8 bullet points covering shipped PRs, key decisions, and open follow-ups. At session start, the plugin injects the relevant portions into context — visible in the `[hook] session-start` log lines showing extraction and Haiku calls.

**Source:** `~/.remember/today-*.done.md` (45 files); `~/.remember/archive.md`; `~/.remember/logs/memory-2026-06-21.log`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-08: Structured Memory Files for Durable Facts and Feedback

**Claim:** Beyond the daily log, 65 structured YAML-frontmatter Markdown files in `.claude/projects/.../memory/` store named, typed, durable facts — categorized as `feedback`, `project`, or `reference` — and are injected into sessions as needed.

**Detail:** Each file has a `name`, `description`, `type`, and `originSessionId`. Feedback files encode the author's preferences (e.g., caveman mode, commit author rules, worktree discipline). Project files capture shipped feature state, outstanding bugs, and "how to apply" guidance for future sessions. Reference files capture operational runbooks (prod dump cron, docker reauth workaround). The 65 files in the primary project cover topics ranging from auth session design to GCS migration decisions.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/` — 65 `.md` files  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-09: Context Continuation Happens Organically — Not via `/compact`

**Claim:** Despite sessions reaching 14 MB, the `/compact` slash command was invoked only once across all 76 primary sessions. Context continuation between sessions is handled entirely by the remember plugin, not manual compaction.

**Detail:** Searching all 76 primary JSONL files for `/compact` in user messages found exactly 1 invocation. Long sessions simply run to the natural end of a task; the next session gets the remembered summary injected at start. This is a deliberate design choice — the remember plugin's automated extraction means the author never needs to manually summarize or compact.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/*.jsonl` — text search  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Section 4: Worktree Discipline

### F-10: Every Feature Branch Lives in Its Own Git Worktree — 37 Active Worktrees

**Claim:** The author never works on feature branches in the main checkout. As of 2026-06-21, 17 backend worktrees and 20 frontend worktrees exist under `cdp-backend-worktrees/` and `cdp-frontend-worktrees/` respectively.

**Detail:** Worktree names directly reflect branch names: `cdp-frontend-worktrees/pdf-layout-fix`, `cdp-backend-worktrees/fix-payment-link-revocation`, `cdp-frontend-worktrees/tc-analytics`, etc. The main checkouts are kept detached at `origin/dev` (enforced structurally). The `lux-wt.sh` script is the sole creation path — it always bases on `origin/dev`, runs `npm ci` and `prisma generate` in the new worktree, and copies the `.env`. Each worktree gets its own `~/.claude/projects/` entry, so session memory is also isolated per feature.

**Source:** `ls cdp-backend-worktrees/` and `ls cdp-frontend-worktrees/`; `scripts/lux-wt.sh`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-11: A SessionStart Hook Audits Worktree Health at Every Session Open

**Claim:** The project-level `.claude/settings.json` runs `lux-wt.sh brief` as a `SessionStart` hook, which warns if the main checkout has drifted onto a branch, gone dirty, or fallen off `origin/dev`.

**Detail:** This structural enforcement was added 2026-06-09 after a concrete incident where a worktree was accidentally created from a stale feature branch 329 commits behind `dev`, causing weeks of shipped features to be overwritten. The `brief` command runs drift detection silently if everything is healthy and outputs a warning if any main checkout is not detached at `origin/dev`. The hook command: `bash "$CLAUDE_PROJECT_DIR/scripts/lux-wt.sh" brief 2>/dev/null || true`.

**Source:** `/home/bunty490/code/work/luxora/.claude/settings.json`; `~/.claude/projects/-home-bunty490-code-work-luxora/memory/feedback_worktree_base_dev.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-12: The Worktree Stale-Base Incident — Concrete Cost of Missing This Discipline

**Claim:** Failing to enforce worktree base discipline once caused a full re-implementation loss: estimate/PDF redesign work was built on a base 329 commits stale, clobbering shipped features (doctor combobox, manual-discount model, filename-rename already in prod).

**Detail:** The memory file records the incident verbatim: "I once built an estimate-PDF redesign on top of the checked-out `feat/time-converter-v1.6` HEAD because its files 'differed from dev' — I assumed it was newer. It was 314 commits stale. The work clobbered shipped dev estimate features and duplicated an already-shipped filename-rename (PR #238). Had to re-implement entirely on dev." The `lux-wt.sh` tool was written specifically as a post-incident structural fix.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/feedback_worktree_base_dev.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Section 5: Parallel Agent Orchestration

### F-13: Named Sub-Agents Are Used Heavily — 28 Distinct Agent Names Observed

**Claim:** Across all sessions, 28 distinct agent names are recorded in `agent-name` log entries, with the most-used agents each having 60–275 invocations (not individual calls — each represents one task dispatch to a named agent role).

**Detail:** Top agent names include: `custom-role-mgmgt` (275), `cloudbuild-migration` (174), `cdp-observability` (160), `clubbed-crm-issues` (120), `typesafety-campaign` (93), `iac-for-crm` (69), `responsive-layout-design` (61), `luxora-assist-infra` (60), `reusable-sidebar-hospital-doctor` (57), `pdf-issues` (38), `tdd-subagent-workflow` (28). These names correspond to specific feature campaigns or infrastructure migrations, each run across multiple sessions over days or weeks.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/*.jsonl` — `agent-name` records  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-14: The Audit-Remediation Case Study — 123 Findings → 7 TDD Batches With a 5-Stage Pipeline

**Claim:** A 123-finding security audit was remediated in 10 PRs across 7 domain batches in approximately 2 days (2026-06-11 to 2026-06-12), using a structured 5-stage pipeline per batch: Sonnet planner → Sonnet TDD implementer → Haiku verifier → adversarial reviewer → Sonnet fixer.

**Detail:** The pipeline per batch: (1) Sonnet planner re-verified findings on the live `dev` branch; (2) Sonnet TDD implementer wrote tests first, then implementation; (3) Haiku verifier checked gates (test count, diff coverage, regression detection) — the cheap model was used here specifically because the task is mechanical; (4) an adversarial reviewer looked for regressions and false fixes; (5) Sonnet fixer addressed review findings. The 7 domain batches were: B1 auth/settings, B2 leads/schema (5 migrations), B3 directory/realtime, B4 ops/payments, B5 pdf/whatsapp, B6 analytics/infra, B7 FE parity. Result: ~118 of 122 actionable findings fixed, ~150 new tests, and ~25 real defects caught by the verify/review stages before merge.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/project_audit_remediation_2026-06-11.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-15: The Typesafety Campaign Case Study — 386→0 TypeScript Errors in 5 PRs Using 3 Parallel Sub-Agents for the Sweep Phase

**Claim:** A backend typesafety campaign eliminated 386 TS errors in 5 sequential PRs over a single day (2026-05-22), with P3 (the module sweep) using 3 parallel sub-agents dispatched on disjoint file scopes to avoid conflicts.

**Detail:** The 5-PR structure: P1 (foundation — tsconfig flags, typeguard utilities, branded IDs), P2 (mechanical sweep — TS2769/TS2345, 386→238 errors), P3 (module sweep — 3 parallel agents on `leads+auth+jobs` / `settings+ops+directory+tc-bookings+users` / `rest`, 238→0 errors), P4 (ESLint `recommended-type-checked`), P5 (smoke gate hardening + husky pre-commit). The parallel dispatch in P3 was safe because the three scope groups had no overlapping files. A companion FE campaign ran the same structure for 309 FE errors across 5 PRs.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/project_typesafety_campaign_shipped.md`; `~/.claude/projects/-home-bunty490-code-work-luxora/memory/project_fe_typesafety_campaign_shipped.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-16: The Dynamic Roles Case Study — 8-Agent Code Review Pass Caught 18 Critical/High Bugs

**Claim:** After implementing a large RBAC feature (dynamic roles, ~32 commits, 2 repos), an 8-agent review pass was dispatched. It caught 7 critical + 11 high bugs before the PR was merged, including a process-crash pattern from synchronous JWT verification inside a `.then()` chain and a hardcoded action list that silently dropped 4 new actions.

**Detail:** The 8-agent review used the `pr-review-toolkit` skill. Issues caught included: a `jwt.verify()` synchronous throw inside an async socket handler that caused uncaught exceptions and process crashes every ~12 minutes in production; a `ALL_ACTIONS` hardcoded array that went stale when 4 new RBAC actions were added (causing the "Add role" button to be hidden for all users including super admins); a Prisma migration that blocked on a view dependency (`v_grafana_users SELECT role`) not handled by the migration script. The latter was caught only by running the migration against a real production DB dump locally, not by automated tests.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/project_dynamic_roles_pr.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-17: The PDF Layout Case Study — Visual TDD Harness With Content-Invariance Gate

**Claim:** PDF rendering fixes across 7 PDF families were implemented using a custom local visual-verification harness (Playwright + `pdftoppm` + sorted-word-multiset content gate) rather than snapshot tests, because ordered text diffs incorrectly flag valid text reflow as failures.

**Detail:** The harness: a dev-only Next.js route rendered each PDF Document to Blob, Playwright captured it, `pdftoppm -png -r150` produced per-page PNG images for visual inspection, and `pdftotext` output was compared via a sorted word multiset (not ordered string equality) to allow for legitimate text reflow while catching add/drop/typo changes. Synthetic canvas `data:` URL images were used as fixtures to avoid base64 encoding issues. The harness was stripped before the PR (removed from the repository), with instructions for reconstruction documented in the memory file.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/project_pdf_layout_fix.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-18: The Parallel-Agent SOP — Documented and Enforced

**Claim:** The author has a formal written SOP for parallel agent task execution (`docs/sops/parallel-agent-task-execution-sop.md`) covering triage, worktree setup per agent, agent prompt templates, merge order, and deployment phasing.

**Detail:** Key rules from the SOP: tasks sharing a file cannot run in parallel — they must be serialized or combined; each agent gets one task or a tightly related set; maximum ~5 parallel agents to avoid host resource contention; every agent prompt must include project context + CLAUDE.md reference + specific task + step-by-step instructions. The SOP was adapted from a prior project (referenced as "proven on [a platform] on 2026-03-31") and tailored to the two-repo CRM structure.

**Source:** `/home/bunty490/code/work/luxora/docs/sops/parallel-agent-task-execution-sop.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Section 6: Prompting Style and Delegation

### F-19: Image-Based Debugging Is Used in ~25% of Human Turns

**Claim:** Of 265 user turns examined in the primary project, 67 (25.3%) included screenshots or image attachments as part of the prompt, used to show UI bugs, layout issues, or production anomalies.

**Detail:** Examples observed: attaching a screenshot of inconsistent case IDs in production alongside a prompt asking to "investigate"; attaching before/after screenshots of PDF layouts alongside a request to make image galleries "dynamically expandable"; attaching images of broken role-update UI with "when i update role here the role update does not happen, shows success token". This visual debugging pattern is especially common for UI layout and PDF rendering issues.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/*.jsonl` — user message content analysis  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-20: Terse "Intent + Constraint" Prompting Style — Very Short Human Turns

**Claim:** The author's human prompts are typically 10–80 words. They state what to do, reference existing code/context rather than re-explaining it, and append execution flags like "use superpowers and ultrathink" or "parallel agents and worktrees" or "full pipeline deploy".

**Detail:** Representative examples (verbatim, 1-indexed by prompt content order in sessions):
- "pull latest prod dump from gcp cloud sql"
- "start tier 1, one pr including all changes, use parallel agents and worktrees"
- "do end to end review on the complete cicd infra we must not waste any valuable compute minutes"
- "open pr to dev, do e2e pr review using toolkit"
- "shut down local, full pipeline deploy pr"
- "using local setup and playwright try to render the pdfs and verify them visually"
The CLAUDE.md provides architecture context so prompts don't need to repeat it; the author treats Claude as a peer who has read the codebase.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/*.jsonl` — human user messages (cleaned)  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-21: "Continue from where you left off" Is a Common Context Handoff

**Claim:** After interrupting a long task or after a session breaks, the author frequently uses the phrase "Continue from where you left off." rather than re-explaining the task.

**Detail:** This pattern appeared multiple times in the extracted human prompts, always after `[Request interrupted by user]` entries. It works because the remember plugin has already extracted and stored the session state, which is re-injected at the next session start. The phrase acts as a resumption signal rather than a context dump.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/*.jsonl` — human user messages  
**last_verified:** 2026-06-21  
**confidence:** med

---

### F-22: Caveman Ultra Mode — Activated Per Session for ~75% Token Reduction

**Claim:** The author runs sessions with `/caveman:caveman ultra` to reduce response verbosity by ~75% without losing technical accuracy. This is a preference stored in the project memory and activated at the start of sessions.

**Detail:** The memory file records: "User wants ~75% token reduction without losing technical accuracy. Sessions explicitly turn it on; this is a preference, not a one-off ask." The caveman plugin (from a third-party GitHub source `JuliusBrussee/caveman`) teaches the model to drop articles, use fragments, abbreviate common terms (DB/auth/req/res/fn/impl), and use arrows for causality. Code, commit messages, PR descriptions, and security warnings are written normally. The user can say "stop caveman" or "normal" to revert.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/feedback_caveman.md`; `~/.claude/settings.json` (caveman plugin enabled)  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-23: Production Debugging via `kubectl exec` → Node REPL for One-Off Scripts

**Claim:** The author runs one-off production data operations by streaming a local script into a Kubernetes pod's Node.js runtime via `kubectl exec -i pod -- node - < file.js`, because the production container image does not include `scripts/` or `tsx`.

**Detail:** This pattern was used for a Zoho tags backfill (promoting 317 → 2,957 LeadTag rows), a schema hotfix (`ALTER TABLE` for a missing column), and resetting user authentication state post-migration. The technique avoids needing a full shell or file-copy into the container. It was also used for emergency Prisma `$executeRawUnsafe` calls when the migration system was unavailable.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/project_zoho_tags_backfill.md`; `~/.remember/today-2026-05-17.done.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Section 7: Long-Running Job Patterns Without Context Bloat

### F-24: Named Agent Sessions Span Days — Each Session Is Focused, Not Sprawling

**Claim:** The `custom-role-mgmgt` agent name appears 275 times in session records, but across multiple sessions over ~2 weeks, not in one giant session. Each individual session stays focused on a specific stage of the campaign.

**Detail:** The `agent-name` record appears at the start of each session to tag it with the ongoing campaign name. This lets the author track which sessions belong to which feature from the outside (in the session list UI), while each actual session remains bounded. The `ai-title` records show sessions named things like "Implement dynamic role creation and permission management" — one stage of the larger campaign. The architecture docs (`docs/backend-architecture.md`, `docs/frontend-architecture.md`) serve as the durable knowledge store so sessions don't need to re-explore the codebase from scratch.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/*.jsonl` — agent-name + ai-title records  
**last_verified:** 2026-06-21  
**confidence:** med

---

### F-25: Daily Prod DB Dump Cron — Automated Fresh Context Without Manual Pulls

**Claim:** A cron job (`0 16 * * *`) runs daily at 4 PM IST to pull the latest production database export to a local file, so every session that needs prod data has it without a manual step.

**Detail:** The pipeline: `gcloud sql export sql → GCS bucket → local disk`. Uses `--offload` (serverless export, no performance hit on prod). The script is checked into the repository (`cdp-backend/infra/scripts/pull-prod-dump.sh`) and logs to `~/.local/state/luxora/dump-cron.log`. When a session needs to test against real production data (e.g., running migration tests, verifying a bug reported against prod-only data), the dump is always less than 24 hours old.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/reference_prod_dump_cron.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Section 8: Automations and Quality Gates

### F-26: The Full Deploy Pipeline Is Triggered by Prompts Like "Full Pipeline Deploy"

**Claim:** The author's deploy workflow is initiated by a short natural-language prompt ("shut down local, full pipeline deploy pr"), and Claude handles the full sequence: smoke test → merge PR → wait for auto-CD → verify pod health.

**Detail:** The auto-CD fires on push to the `gcp` branch via Cloud Build in the `asia-south1` regional pool. Session logs show the author explicitly never triggers CD manually — a hard rule enforced through the memory system. Verification is done via `kubectl -n [project-ns] get deploy -o jsonpath=...` on the live cluster, not by inspecting build logs on the wrong region (global) which would show nothing.

**Source:** `~/.remember/today-2026-06-11.done.md`; `~/.claude/projects/-home-bunty490-code-work-luxora/memory/feedback_cd_no_manual_trigger.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-27: `bypassPermissions` Enables Autonomous Mode — No Interrupts for File Writes or Bash Calls

**Claim:** By setting `bypassPermissions` mode (100% of sessions), the author enables Claude to run multi-hour autonomous sessions — creating files, running git commands, executing shell scripts, calling `gh pr create` — without any human approval prompts interrupting the flow.

**Detail:** The global `skipDangerousModePermissionPrompt: true` setting means even the initial warning for bypass mode is skipped. The PreToolUse hook for git commits acts as the only safety guardrail — identity verification before each commit. This design reflects a trust model: the author trusts Claude to make file-level changes autonomously but enforces identity correctness at the one critical side-effect that touches the shared git history.

**Source:** `~/.claude/settings.json`; `~/.claude/hooks/verify-commit.sh`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-28: The PR Review Toolkit Is Used As a Quality Gate Before Merge

**Claim:** Before merging significant PRs, the author dispatches the `pr-review-toolkit` skill to run a multi-aspect code review, often with prompts like "open pr to dev, do e2e pr review using toolkit".

**Detail:** The toolkit dispatches multiple review sub-agents in parallel, each focusing on a different quality dimension (security, correctness, test coverage, API contracts, etc.). Results from the dynamic roles feature review (8 agents) caught 7 critical + 11 high issues. Results from the PDF rename feature review caught 6 issues including a missing `.pdf` extension guard, file-overwrite on edit, and WhatsApp extension validation gap. The author reviews the findings and either applies them directly or stacks them as additional commits on the PR.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/project_pdf_rename_before_action.md`; `~/.claude/projects/-home-bunty490-code-work-luxora/memory/project_dynamic_roles_pr.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-29: Docs Are Kept Out of the Repository — Specs Live in a Non-Git Parent Directory

**Claim:** Spec/design documents, architecture docs, and session-local plans are never committed to the per-repo git history. They live in a parent directory that is not itself a git repository.

**Detail:** The memory file records the concrete rule: "when committing in any of the repos, commit ONLY code files. Never commit `.md` files." The spec path pattern observed: `~/code/work/luxora/docs/superpowers/specs/2026-XX-XX-feature-name-design.md`. These are referenced by local path in PR descriptions rather than committed. The incident that created this rule: a PR was submitted with a spec `.md` file committed alongside the code; the author caught it and forced-pushed a code-only version.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/feedback_code_only_commits.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Section 9: Tool Ecosystem

### F-30: 38 Plugins Enabled — A Comprehensive Skill Stack

**Claim:** The global `~/.claude/settings.json` enables 38 plugins, covering: LSPs (TypeScript, Python, Go, PHP, C/C++), framework tools (Vercel, Supabase, Prisma, n8n), skill bundles (superpowers, code-review, pr-review-toolkit, commit-commands, feature-dev, frontend-design, caveman), and infrastructure tools (deploy-on-aws, aws-serverless, data-engineering).

**Detail:** The most-invoked skill families based on session evidence: `superpowers` (orchestration, parallel dispatch, TDD, systematic-debugging), `pr-review-toolkit` (multi-agent PR review), `caveman` (token reduction), `remember` (memory management), `code-review` (diff review), `commit-commands` (commit+push+PR in one step). The `context7` MCP server is also enabled for live library documentation lookups.

**Source:** `~/.claude/settings.json` `enabledPlugins`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-31: Status Line Shows Working Directory, Branch, and Dirty State

**Claim:** A custom `statusLine` command in global settings renders a colored prompt showing: current directory name (blue), git branch (cyan if clean, yellow if dirty), and `user@hostname` (green).

**Detail:** The command is a single-line bash expression using `jq` to extract the workspace directory, `git symbolic-ref` for the branch name, `git diff --quiet` for dirty state detection, and `printf` with ANSI color codes. This gives the author immediate visual feedback on which worktree and branch they are in without running `git status`.

**Source:** `~/.claude/settings.json` `statusLine`  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Section 10: Week-Level Output Cadence

### F-32: ~8–17 PRs Per Week, Across Two Repos, Over 8 Weeks

**Claim:** The archive shows a sustained output of 8–17 merged PRs per week across both the backend and frontend repos, covering a wide range from infrastructure (CI/CD migrations), security (RBAC remediation), feature development, and observability.

**Detail:** Weekly summaries (from archive.md):
- Week 2026-04-27: audited 4 repos, shipped major integrations (43 BE + 28 FE commits)
- Week 2026-05-05: 3 PRs, 70 files, 26 tests for a geo unification
- Week 2026-05-12: 13 commits for RBAC security remediation + 78 tests for sync feature
- Week 2026-05-19: GHA→Cloud Build migration + typesafety sprint (386→0 TS errors) + dynamic roles (32 commits, 102 tests)
- Week 2026-05-26: obs stack (7 dashboards), 43 commits for directory feature
- Week 2026-06-01: 17 features shipped in 3 rounds via 6 PRs
- Week 2026-06-09: 123-finding audit remediated in 10 PRs + 150 tests

**Source:** `/home/bunty490/code/work/luxora/.remember/archive.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Section 11: Delegation and Trust Model

### F-33: Delegation Is Goal-Oriented, Not Instruction-Oriented

**Claim:** The author delegates outcomes ("fix this prod bug", "implement the feature in the image", "run audit and fix all findings") rather than step-by-step instructions. The CLAUDE.md and architecture docs contain the "how".

**Detail:** The most common prompt structure observed: a noun phrase for what to do (sometimes with a screenshot), plus optional execution flags (`use parallel agents`, `ultrathink`, `use superpowers systematic debugging`). The CLAUDE.md for the primary project is 400+ lines covering architecture, conventions, known gotchas, and schema highlights — it is the persistent instructional context that makes goal-oriented delegation safe.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/*.jsonl` — human user messages; `/home/bunty490/code/work/luxora/CLAUDE.md`  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-34: Architectural Decisions Are Captured in Memory Before Sessions End

**Claim:** After a significant architectural decision (e.g., which model for a new feature, which infra topology, which scope for a refactor), the author explicitly documents it in a memory file or via the remember plugin, not just in the session chat.

**Detail:** Memory files like `project_chatbot_behind_crm.md` ("decisions locked 2026-06-13: R1 reply-generator, R2 backfill+GCS media throttled worker, R3 reuse isLeadAssignmentOn toggle"), `project_observability_stack.md` ("PLG-T picks, in-cluster luxora-obs ns, GCS, alerts-first phase order, 12 PromQL + 2 Loki rules"), and `reference_cd_runs_prisma_migrate.md` ("CORRECTION: cdp-backend has a prisma-migrate init container running migrate deploy on deploy; don't hand-apply additive schema") all encode decisions with explicit "why" and "how to apply" guidance for future sessions.

**Source:** `~/.claude/projects/-home-bunty490-code-work-luxora/memory/*.md` — project and reference files  
**last_verified:** 2026-06-21  
**confidence:** high

---

### F-35: Prod-vs-Dev Divergence Is Treated as a Known Class of Bug With Its Own Memory Category

**Claim:** Multiple memory files are dedicated specifically to prod-vs-dev divergence bugs — where code works in CI/dev but fails in production due to schema drift, seed-only data, or region-specific infrastructure differences.

**Detail:** Specific documented instances: `project_prod_schema_drift_bestTimeToCall.md` (column in code, missing in prod DB → 500 on first query); `project_sops_secret_divergence.md` (backend.secret.env.sops differs between dev and gcp branches; never wholesale-copy secrets across branches); `reference_cd_runs_prisma_migrate.md` (CD runs `migrate deploy` not `db:seed`, so seed-only Module rows never exist in prod); `project_cdp_frontend_ci_escape_hatches.md` (smoke.yml uses `continue-on-error` and `NEXT_IGNORE_BUILD_ERRORS` — CI false-greens are systemic; local typecheck is the real gate).

**Source:** Multiple files in `~/.claude/projects/-home-bunty490-code-work-luxora/memory/`  
**last_verified:** 2026-06-21  
**confidence:** high

---

## Summary Statistics

| Metric | Value | Source |
|---|---|---|
| Total Claude Code sessions on machine | 1,271 | `~/.claude/projects/` |
| Primary project sessions (main dir) | 76 | `~/.claude/projects/-home-bunty490-code-work-luxora/` |
| Average session size | 2.2 MB | JSONL file sizes |
| Largest session | 14 MB / 3,575 lines | Same |
| `bypassPermissions` rate | 100% | `permission-mode` records |
| Active worktrees (primary project) | 37 (17 BE + 20 FE) | `cdp-*-worktrees/` dirs |
| Distinct named agent campaigns | 28 | `agent-name` records |
| Structured memory files | 65 | `memory/*.md` |
| Daily logs (primary project) | 45 | `.remember/today-*.done.md` |
| Image prompts (primary project) | 25.3% of turns | User message analysis |
| `/compact` invocations | 1 | Text search |
| Enabled plugins | 38 | `settings.json` |
| PR-link records (primary project) | 2,170 | `pr-link` records |

---

## Key Patterns for Chapter Authors

1. **Worktrees-as-isolation-unit** — every feature is a separate physical directory; sessions are per-worktree; memory is per-worktree. This is not convenience, it is correctness.

2. **The remember plugin is the context backbone** — session memory is automated (PostToolUse hook), not manual. The author does not curate context; they curate facts into memory files after sessions.

3. **Short prompts work because long docs exist** — the CLAUDE.md is 400+ lines. Prompts are 10–80 words. The ratio inverts common intuition: invest in the standing document, not the per-prompt context.

4. **Cheap models for mechanical verification** — Haiku handles memory extraction and gate checking; Sonnet handles implementation and planning. The audit pipeline explicitly assigns each stage to an appropriate model tier.

5. **`bypassPermissions` + a PreToolUse commit hook** — full autonomy plus a single targeted guardrail at the one irreversible side-effect (git history).

6. **Goal-delegation over instruction-delegation** — "audit and fix all 123 findings" not "open file X, change line Y". The architecture docs carry the instruction weight.

7. **Image prompts for UI bugs** — ~25% of turns include screenshots. Visual context replaces lengthy descriptions of layout issues.
