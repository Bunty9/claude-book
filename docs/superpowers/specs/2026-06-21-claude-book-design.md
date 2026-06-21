# Claude, End to End — Design Spec

**Date:** 2026-06-21
**Status:** Approved (design), pending spec review → writing-plans
**Repo:** `Bunty9/claude-book` → `~/code/personal/claude-book`
**Template/reference:** `Bunty9/evm-book` (Vite+React+MDX+PWA, superpowers-built)

---

## 1. Summary

An interactive, book-length field guide to working with **Claude** and **Claude Code** — from "what is an LLM" through power-user multi-agent orchestration. EVM-book-grade production quality: MDX content, an immaculate docs-grade SPA, persona-tailored reading paths, and live client-side interactive widgets.

The book is **opinionated and practical**: it teaches not just the feature surface but *how an effective operator actually works* — distilled in part from the author's real corpus of 2,268 Claude Code sessions, `.remember/` daily logs, and persisted memories.

### Working title
**"Claude, End to End"** — subtitle: *An interactive field guide to working with Claude & Claude Code.*

### Non-goals (v1)
- No backend, no auth, no accounts. Pure SPA; all per-user state in `localStorage`.
- No server-side LLM calls. The only live model usage is an **optional** "bring-your-own-API-key" mode in the PromptLab widget (key stays client-side, never persisted server-side).
- No i18n, no CMS, no comments system.

---

## 2. Goals & success criteria

1. **Pace to the reader.** Three persona tracks share one chapter pool; a reader is never bored (too slow) or lost (too fast).
2. **Complete.** Covers LLM fundamentals → Claude → Claude Code harness → every tool/part of the harness → context engineering → prompting/spec → multi-agent orchestration → e2e dev workflow → extending (skills/plugins/MCP/API/CLI/extensions) → automation & integrations (n8n/GSuite) → keeping current → mastery.
3. **Interactive.** Every concept that is clearer *shown* has a widget. Pure client-side, deterministic, TDD'd.
4. **Grounded & current.** Feature/ecosystem claims are researched against live sources and cited; a "keep up" chapter lists durable live sources.
5. **Beautiful.** Docs-grade UI/UX on par with shadcn/Tailwind/Next.js docs. Dark-mode-first, installable PWA, fast, offline-capable.
6. **Shippable quality bar:** `typecheck` + `vitest` + `lint` all green; Lighthouse PWA installable; search works offline.

---

## 3. Personas & tracks

One landing **PathPicker** wizard recommends a track; the reader can switch anytime. Tracks are *orderings/subsets* over the shared chapter pool, not separate content.

| Track | Reader | Emphasis |
|---|---|---|
| **First Contact** | First-time / minimal exposure (may or may not code) | Gentle ramp, frequent small wins, plain-language fundamentals, safety/permissions, first real task. |
| **The Engineer** | Strong coder, weak Claude leverage | Harness internals, context engineering, prompting/spec, TDD-with-cheap-agents, multi-agent orchestration, e2e dev workflow, max performance. |
| **The Automator** | Little/no code, wants automations & integrations | MCP, skills, scheduling, **n8n + GSuite**, Zapier, building a personal automation system. |

Each chapter's frontmatter declares its position in each track (or absence). A chapter can belong to 1–3 tracks at different orders.

---

## 4. Information architecture

### Shell (ported from evm-book IA, rebuilt on Next App Router)
- **Sidebar** — track-aware tree of parts→chapters; shows progress ticks.
- **Router** — App Router routes; one route per chapter (`/c/<id>`), landing `/`, path picker `/start`, reference pages.
- **TableOfContents** — in-page heading nav (right rail).
- **PrevNext** — follows the *active track's* order, not global order.
- **Breadcrumbs**, **ThemeToggle** (dark-first), **Search** (⌘K, minisearch client index).
- **PathPicker** — onboarding wizard; persists `activeTrack`.
- **ProgressTracker** — `localStorage`; per-track completion + bookmarks; "resume where you left off."

### Routing & SPA/PWA
- Next.js App Router with `output: 'export'` → fully static SPA.
- PWA: service worker (precache shell + content + search index), web manifest, offline fallback, installable.

---

## 5. Content model

### Chapter frontmatter (typed, validated at build)
```ts
interface ChapterMeta {
  id: string;            // stable slug, e.g. "what-is-an-llm"
  title: string;
  part: PartId;          // P0..P10
  tracks: Partial<Record<'beginner'|'engineer'|'automator', number>>; // order within track
  difficulty: 1|2|3|4|5;
  estMinutes: number;
  tags: string[];
  summary: string;       // for search + cards + "also relevant"
}
```
- `src/content/manifest.ts` — typed registry of all chapters; single source of truth for nav, search, track ordering. Validated by a `manifest.test.ts` (every MDX file is registered; every registered file exists; track orders are contiguous & unique).
- Content lives in `src/content/<part>/NN-<id>.mdx`.

### Search
- Build step extracts plaintext bodies → `searchDocs` → minisearch index, shipped as static JSON, loaded client-side. (Port evm-book `searchIndex`.)

---

## 6. Content outline (shared spine)

~11 parts, ~55 chapters. Track membership noted as **[B]** beginner / **[E]** engineer / **[A]** automator.

### P0 — Orientation *(all tracks)*
- How to use this book & pick your path **[B,E,A]**
- What is an LLM, fundamentally — tokens, next-token prediction, context, training vs inference, why it hallucinates **[B,E,A]**
- What is Claude — model family (Opus/Sonnet/Haiku/Fable), modalities, what it's good/bad at **[B,E,A]**
- What is Claude Code — agentic harness vs a chat box; the mental model **[B,E,A]**

### P1 — First Contact *(beginner-led)*
- Install & first session — CLI, desktop, web, IDE extensions **[B,A]**
- The chat loop — prompts, turns, reading responses **[B]**
- Permissions, modes & safety — what Claude can/can't touch, approving actions **[B,A]**
- Your first real task, end to end — a small concrete win **[B]**

### P2 — The Harness *(engineer-led; beginner gets a lite pass)*
- Anatomy of the agent loop — system prompt, context, model, tool calls, results, repeat **[B-lite,E]**
- The tool surface — Read/Write/Edit/Bash/Grep/Glob/Task/WebSearch/… what each does & when **[E,A]**
- Permissions & modes deep dive — plan mode, accept-edits, sandboxing **[E]**
- Hooks — SessionStart/PreToolUse/etc.; automating harness behavior **[E,A]**
- Slash commands & built-ins **[E,A]**
- Settings, env & config (`settings.json`) **[E,A]**

### P3 — Context Engineering *(engineer-led)*
- The context window & its budget — what's in it right now **[E,A]**
- Compaction & autocompact — why it triggers, how to keep context lean **[E]**
- Memory — CLAUDE.md, the memory tool, the `/remember` pattern **[E,A]**
- Long-running tasks without context bloat — the operator's real technique **[E]**
- Documentation as context — docs that make Claude better **[E,A]**

### P4 — Prompting & Spec Engineering *(engineer-led; automator subset)*
- Effective prompting for Claude — specificity, examples, structure **[B,E,A]**
- Output styles & compression (caveman, learning) **[E]**
- Planning an idea — brainstorm → spec → plan (the superpowers flow) **[E,A]**
- TDD with low-cost agents + a good dev env/tools **[E]**
- What Claude expects from you & building trust — the delegation contract **[B,E,A]**

### P5 — Multi-Agent Orchestration *(engineer-led)*
- Subagents & the Agent tool **[E]**
- Parallel agent teams — fan-out, when & how **[E]**
- Workflows — deterministic orchestration (pipeline/parallel/loops) **[E]**
- Worktrees for isolation — feature-per-worktree discipline **[E]**
- Cost-tiering — cheap agents for grunt, expensive for judgment **[E,A]**

### P6 — The Dev Workflow, End to End *(engineer-led)*
- Offloading every stage — explore→design→plan→TDD→implement→review→ship **[E]**
- Git, PRs, CI/CD with Claude **[E]**
- Code review — adversarial subagent panels, verify-before-claim **[E]**
- Case study — how a feature actually ships (anonymized from real sessions) **[E]**

### P7 — Extending Claude *(engineer + automator)*
- Skills — using & writing **[E,A]**
- Plugins & marketplaces **[E,A]**
- MCP — using servers & building your own **[E,A]**
- The Claude API & Agent SDK **[E]**
- Browser (Chrome) & IDE extensions **[E,A]**
- Headless / CLI automation **[E,A]**

### P8 — Automation & Integrations *(automator home)*
- Automating daily repetitive tasks — the mindset **[A,E]**
- n8n + GSuite patterns (Gmail/Drive/Sheets/Calendar) **[A]**
- Zapier MCP & connecting SaaS **[A]**
- Scheduling — cron, loop, schedule, background tasks **[A,E]**
- Building a personal automation system **[A]**

### P9 — Mastery & Power User *(engineer + automator)*
- How a power user really works — case studies mined from real sessions **[E,A]**
- Maximizing performance — model choice, effort, fast mode, when to use what **[E,A]**
- Keeping up with the latest — durable live sources, newest repos/plugins to try **[B,E,A]**
- Delegation maturity — trust, verification, knowing what to keep **[E,A]**

### P10 — Reference *(all)*
- Tool reference · slash-command reference · glossary · model/pricing cheat tables · curated links **[B,E,A]**

---

## 7. Interactive widgets (client-side, deterministic, TDD'd `lib/`)

Flagship set for v1 (each backed by pure logic in `src/lib/` with vitest, rendered by a React component in `src/components/widgets/`):

1. **HarnessExplorer** — clickable agent-loop diagram (context → model → tool call → result → loop); click a node to read what it does.
2. **ContextWindowSim** — visualize a context window filling with turns/tool-results; slider for token budget; shows compaction trigger and lean-vs-bloated runs.
3. **Tokenizer & CostCalculator** — paste text → approx token count → cost per model; side-by-side model comparison. (Heuristic tokenizer in `lib/`, clearly labeled approximate.)
4. **AgentOrchestrationVisualizer** — animate sequential vs parallel agents, worktree isolation, cost tiers; shows wall-clock delta.
5. **PromptLab** — curated before/after prompt pairs + a rule-based prompt scorer (checks for specificity, examples, constraints). Optional BYO-key live mode (client-side fetch to Anthropic).
6. **ToolSurfaceMap** — searchable/filterable catalog of Claude Code tools (what / when / example / gotchas).
7. **Skill/Plugin/MCP Explorer** — browse the ecosystem with filters (type, use-case); links out.
8. **WorktreeWorkflowAnimator** — step-through of feature-per-worktree flow.
9. **TDDLoopVisualizer** — red→green→refactor with where agents plug in.
10. **DecisionTrees** — "Should I use a subagent / workflow / hook / skill?" interactive flowcharts.
11. **PathPicker** — onboarding wizard (a few questions → recommended track).
12. **Quiz** — per-chapter knowledge checks (data-driven from frontmatter/MDX).

All widgets are self-contained, documented (what/how/deps), and individually testable.

---

## 8. Tech architecture

- **Framework:** Next.js (App Router) static export SPA + PWA.
- **UI:** Tailwind + shadcn/ui primitives; Geist / Geist Mono fonts; design tokens in `src/design/tokens.css`.
- **Content:** MDX via `@next/mdx`; typed `manifest.ts`; MDX provider maps custom components (Callout, CodeBlock(shiki), Figure, Mermaid, Markmap, widgets).
- **Search:** minisearch over a build-generated static index.
- **State:** `localStorage` (activeTrack, progress, bookmarks, theme, BYO key).
- **Testing:** vitest + @testing-library/react; all `lib/` logic TDD'd; `manifest.test.ts`, `nav.test.tsx`.
- **Tooling:** TypeScript strict, ESLint, scripts: `dev/build/preview/lint/typecheck/test`.

### Directory layout (target)
```
src/
  app/            # Next routes + shell (Sidebar, Search, TOC, PrevNext, ThemeProvider, PathPicker)
  components/     # MDX building blocks (Callout, CodeBlock, Figure, Mermaid, Markmap)
    widgets/      # interactive widgets (HarnessExplorer, ContextWindowSim, ...)
  content/<part>/NN-<id>.mdx
  content/manifest.ts
  lib/            # pure logic + tests (tokenizer, cost, search index, prompt scorer, ...)
  design/tokens.css
docs/superpowers/{specs,plans}/
public/           # icons, manifest.webmanifest, og images
scripts/          # build-search-index, content-workflow
```

---

## 9. Research plan (parallel, cited) — implementation phase

Run as a Workflow before/alongside authoring. Each team returns a structured, source-cited research packet that chapter authors consume.

- **Team A — Claude Code feature surface:** harness, tools, hooks, slash commands, settings, modes. Grounded by the `claude-code-guide` agent + official docs (context7/WebFetch).
- **Team B — Ecosystem latest:** plugins, MCP servers, skills, marketplaces, notable repos. Live web + GitHub search; flag release dates; mark "newest to try."
- **Team C — Model/API/SDK facts:** model ids, pricing, capabilities, Agent SDK. Grounded by the `claude-api` skill + context7.
- **Team D — Automation patterns:** n8n + GSuite, Zapier MCP, scheduling. n8n-mcp skills + web.
- **Team E — Mine local usage:** parse `~/.claude/projects/**/*.jsonl`, `history.jsonl`, `.remember/`, and memories → distill real power-user patterns (parallel agents, worktrees, TDD, context discipline, long-running jobs, automations). Produce **anonymized** case studies. No secrets/credentials copied into the book.

**Verification:** reviewer agents fact-check each chapter's claims against the packets; uncited hard claims get flagged or softened.

---

## 10. Build orchestration (full parallel — author opted in)

Implementation is driven by a **Workflow**:
1. Scaffold app (Next + Tailwind + shadcn + MDX + PWA + test harness) and port evm-book shell IA.
2. Research teams (A–E) run in parallel → packets.
3. Authoring fan-out: chapter writers (consume packets → MDX, track-tagged) + widget engineers (TDD `lib/` → React) + shell/PathPicker/PWA.
4. Verify gates: typecheck + vitest + lint green; reviewer fact-check; search index builds; PWA installable.

Sequencing across turns: scaffold + manifest + shell first (so authored chapters have a home and gates exist), then research, then content/widgets in waves, then polish.

---

## 11. Testing & quality gates

- `pnpm typecheck` — strict, 0 errors.
- `pnpm test` — vitest; every `lib/` module covered; manifest & nav invariants tested.
- `pnpm lint` — clean.
- `pnpm build` — static export succeeds; search index generated; PWA manifest + SW present.
- Manual: install as PWA, go offline, search still works, theme persists, track switching reorders nav & prev/next.

---

## 12. Open items (resolve during planning)
- Final title confirmation (working: "Claude, End to End").
- Fumadocs vs hand-ported shell (default: hand-port for control; revisit if time-boxed).
- Exact v1 chapter cut (all ~55 vs a first wave) — full parallel build targets all, but plan should allow wave-based merge.
