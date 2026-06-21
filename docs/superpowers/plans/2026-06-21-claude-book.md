# Claude, End to End — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive, persona-tracked, EVM-book-grade SPA that teaches Claude & Claude Code end to end, with researched/cited MDX content and client-side interactive widgets.

**Architecture:** Next.js App Router static-export SPA + PWA. Typed chapter manifest drives track-aware nav, search, and prev/next. MDX content renders custom components + widgets. All widget behavior lives in pure, TDD'd `src/lib/` modules. All reader state is `localStorage`. Content is produced by parallel research → authoring → fact-check waves.

**Tech Stack:** Next.js (App Router, `output:'export'`), TypeScript (strict), Tailwind + shadcn/ui, `@next/mdx`, shiki, mermaid, markmap, minisearch, `@ducanh2912/next-pwa`, vitest + @testing-library/react, pnpm.

## Global Constraints

- Package manager: **pnpm**. Node ≥ 20.
- TypeScript **strict**; no `any`, no non-null `!`, no `as` casts to escape types (mirror author's typesafety SOP).
- Git identity for every commit: **Bunty9 <cbipin2000@gmail.com>**. Conventional commits. **No AI attribution** anywhere (commits, PRs, content credits).
- SPA only: `output: 'export'`; no server components doing runtime data fetch, no API routes (except none). All dynamic behavior client-side.
- Reader state in `localStorage` only. No backend, no auth.
- Every `src/lib/` module ships with a vitest test written first (TDD).
- Every hard factual claim in content must trace to a research packet source; uncited hard claims get softened or flagged.
- Dark-mode-first. Design tokens in `src/design/tokens.css`; no hardcoded hex in components.
- Quality gates (must pass before any wave is "done"): `pnpm typecheck` (0), `pnpm test` (green), `pnpm lint` (clean), `pnpm build` (static export succeeds).

---

## Phase 0 — Foundation (bite-sized TDD; ship a working 1-chapter, 1-widget book)

Deliverable: a deployable SPA with the shell, one real chapter, one real widget, search, theme, PWA, and green gates. This proves the entire pipeline end to end before fan-out.

### Task 0.1: Scaffold Next app + tooling

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `.eslintrc.cjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Init project**

```bash
cd ~/code/personal/claude-book
pnpm dlx create-next-app@latest . --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --no-turbopack --use-pnpm --yes
```
(If the dir is non-empty due to `docs/` + `.git`, scaffold in a temp dir and move files in; keep `docs/` and `.git`.)

- [ ] **Step 2: Add deps**

```bash
pnpm add @next/mdx @mdx-js/react @mdx-js/loader remark-gfm rehype-slug rehype-autolink-headings shiki mermaid markmap-lib markmap-view minisearch @ducanh2912/next-pwa @fontsource-variable/geist @fontsource-variable/geist-mono
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Configure static export + MDX in `next.config.mjs`**

```js
import createMDX from '@next/mdx'
import withPWAInit from '@ducanh2912/next-pwa'

const withMDX = createMDX({
  options: { remarkPlugins: [['remark-gfm']], rehypePlugins: [['rehype-slug'], ['rehype-autolink-headings']] },
})
const withPWA = withPWAInit({ dest: 'public', disable: process.env.NODE_ENV === 'development' })

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  images: { unoptimized: true },
  trailingSlash: true,
}
export default withPWA(withMDX(config))
```

- [ ] **Step 4: Configure vitest**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'], globals: true },
})
```
`vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 5: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "preview": "npx serve out",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "build:search": "node scripts/build-search-index.mjs"
}
```

- [ ] **Step 6: Verify it boots & commit**

Run: `pnpm typecheck && pnpm build`
Expected: build completes, `out/` produced.
```bash
git add -A && git commit -m "chore: scaffold next static-export SPA with mdx, pwa, vitest"
```

### Task 0.2: Design tokens + base theme

**Files:**
- Create: `src/design/tokens.css`
- Modify: `src/app/globals.css` (import tokens, Geist fonts, dark-first)

- [ ] **Step 1:** Define CSS custom-property tokens (color scales, surface/fg/accent, radius, spacing, font vars) in `tokens.css`, with `:root` (dark) + `.light` overrides.
- [ ] **Step 2:** Import tokens + `@fontsource-variable/geist` into `globals.css`; set body to use tokens.
- [ ] **Step 3:** Run `pnpm build`; commit `style: design tokens + dark-first base theme`.

### Task 0.3: Chapter manifest types + registry (TDD the invariants)

**Files:**
- Create: `src/content/manifest.ts`, `src/content/types.ts`
- Test: `src/content/manifest.test.ts`

**Interfaces:**
- Produces: `ChapterMeta` interface (per spec §5); `chapters: ChapterMeta[]`; helpers `chaptersForTrack(track): ChapterMeta[]` (sorted by that track's order), `chapterById(id): ChapterMeta | undefined`, `tracks = ['beginner','engineer','automator'] as const`, `type TrackId`.

- [ ] **Step 1: Write failing test** (`manifest.test.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { chapters, chaptersForTrack, chapterById, tracks } from './manifest'

describe('manifest invariants', () => {
  it('has unique ids', () => {
    const ids = chapters.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('each track order is contiguous starting at 1', () => {
    for (const t of tracks) {
      const orders = chaptersForTrack(t).map(c => c.tracks[t]!).sort((a,b)=>a-b)
      orders.forEach((o,i) => expect(o).toBe(i+1))
    }
  })
  it('chapterById resolves a known id', () => {
    expect(chapterById(chapters[0].id)?.id).toBe(chapters[0].id)
  })
})
```

- [ ] **Step 2:** Run `pnpm vitest run src/content/manifest.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement `types.ts` (`ChapterMeta`, `TrackId`) + `manifest.ts` with the helper functions and a seed array containing the Phase-0 sample chapter only.
- [ ] **Step 4:** Run test → PASS.
- [ ] **Step 5:** Commit `feat: typed chapter manifest with track invariants`.

### Task 0.4: Search index lib (TDD) + build script

**Files:**
- Create: `src/lib/searchIndex.ts`, `scripts/build-search-index.mjs`
- Test: `src/lib/searchIndex.test.ts`

**Interfaces:**
- Produces: `buildIndex(docs: SearchDoc[]): MiniSearch`, `search(index, query): SearchHit[]`, `type SearchDoc = { id; title; summary; body; part }`.

- [ ] **Step 1: Failing test** — index 2 docs, assert query returns the matching id ranked first.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement minisearch wrapper (`fields: ['title','summary','body']`, `storeFields: ['title','summary','part']`).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Write `build-search-index.mjs`: read all `src/content/**/*.mdx`, strip MDX/JSX to plaintext, emit `public/search-index.json` ({docs}). Run it; verify file exists.
- [ ] **Step 6:** Commit `feat: client search index + build script`.

### Task 0.5: MDX provider + core components

**Files:**
- Create: `src/components/MDXComponents.tsx`, `src/components/Callout.tsx`, `src/components/CodeBlock.tsx` (shiki), `src/components/Figure.tsx`, `src/components/Mermaid.tsx`, `src/components/Markmap.tsx`
- Test: `src/components/Callout.test.tsx`

- [ ] **Step 1: Failing test** — render `<Callout type="warning">hi</Callout>`, assert role/text present.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement Callout (variants: note/tip/warning/danger via tokens), CodeBlock (shiki highlight, copy button, client), Figure (img+caption, `unoptimized`), Mermaid (client, dynamic import), Markmap (client). Wire all into `MDXComponents.tsx` map.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: mdx provider + core content components`.

### Task 0.6: App shell — providers + nav (TDD nav)

**Files:**
- Create: `src/app/providers.tsx` (Theme + Track context), `src/lib/track.ts` (localStorage get/set activeTrack, default 'beginner'), `src/app/(book)/layout.tsx`, `src/components/shell/Sidebar.tsx`, `src/components/shell/TableOfContents.tsx`, `src/components/shell/PrevNext.tsx`, `src/components/shell/Breadcrumbs.tsx`, `src/components/shell/ThemeToggle.tsx`
- Test: `src/components/shell/PrevNext.test.tsx`, `src/lib/track.test.ts`

**Interfaces:**
- Consumes: `chaptersForTrack`, `chapterById` (Task 0.3); `useTrack()` context.
- Produces: `prevNextFor(id, track): { prev?: ChapterMeta; next?: ChapterMeta }`.

- [ ] **Step 1: Failing tests** — `track.test.ts` (set→get roundtrip, default), `PrevNext.test.tsx` (`prevNextFor` returns correct neighbors *per track order*, not global).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement track lib, providers, `prevNextFor`, and shell components (Sidebar renders track tree with progress ticks; TOC from headings; ThemeToggle persists).
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: track-aware app shell (sidebar, toc, prevnext, theme)`.

### Task 0.7: Progress tracker (TDD)

**Files:**
- Create: `src/lib/progress.ts`, `src/components/shell/ProgressBadge.tsx`
- Test: `src/lib/progress.test.ts`

**Interfaces:**
- Produces: `markDone(id)`, `isDone(id): boolean`, `completion(track): { done; total; pct }`, `resumeChapter(track): string | undefined`.

- [ ] Standard TDD cycle: failing test (mark→isDone→completion math) → FAIL → implement (localStorage-backed) → PASS → commit `feat: per-track progress tracking`.

### Task 0.8: Chapter route + dynamic MDX loading

**Files:**
- Create: `src/app/(book)/c/[id]/page.tsx` (+ `generateStaticParams` from manifest), `src/lib/loadChapter.ts`
- Test: `src/lib/loadChapter.test.ts` (maps id→file path correctly for every manifest entry)

- [ ] TDD the id→path resolver; implement static param generation + MDX import; render with MDXComponents, TOC, PrevNext, Breadcrumbs. Commit `feat: chapter route with static params`.

### Task 0.9: PathPicker + landing

**Files:**
- Create: `src/app/page.tsx` (landing/hero), `src/app/start/page.tsx` (PathPicker wizard), `src/components/PathPicker.tsx`, `src/lib/recommendTrack.ts`
- Test: `src/lib/recommendTrack.test.ts`

**Interfaces:**
- Produces: `recommendTrack(answers): TrackId` (deterministic rules).

- [ ] TDD `recommendTrack` (answer combos → expected track) → implement wizard (sets activeTrack, routes to track's first chapter) + landing hero. Commit `feat: path picker + landing`.

### Task 0.10: Sample chapter + sample widget end-to-end

**Files:**
- Create: `src/content/foundations/01-what-is-an-llm.mdx`, `src/components/widgets/Tokenizer.tsx`, `src/lib/tokenizer.ts`, `src/lib/cost.ts`
- Test: `src/lib/tokenizer.test.ts`, `src/lib/cost.test.ts`

**Interfaces:**
- Produces: `estimateTokens(text): number` (heuristic, ~chars/4 with whitespace rules), `costFor(tokens, model): { inputUsd; outputUsd }`, `MODELS` price table.

- [ ] **Step 1: Failing tests** — `tokenizer` (empty=0, monotonic with length, known short string within tolerance), `cost` (known tokens×price = expected, all MODELS present).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement `tokenizer.ts`, `cost.ts` (prices verified against the `claude-api` skill during research — placeholder table flagged until then), `Tokenizer.tsx` widget (textarea → live token + cost per model).
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Author `01-what-is-an-llm.mdx` (real chapter, beginner+engineer+automator track-tagged) embedding `<Tokenizer/>`; register in manifest.
- [ ] **Step 6:** Run full gates: `pnpm typecheck && pnpm test && pnpm lint && pnpm build:search && pnpm build`. All green.
- [ ] **Step 7:** Commit `feat: first chapter + tokenizer widget end-to-end`.

### Task 0.11: PWA polish + CI

**Files:**
- Create: `public/manifest.webmanifest`, icons in `public/icons/`, `.github/workflows/ci.yml`

- [ ] Add web manifest (name, icons, theme color, display standalone), verify SW precaches shell+content+search index, offline loads a cached chapter. Add CI workflow (pnpm install → typecheck → test → lint → build). Commit `chore: pwa manifest + CI gates`.

**Phase 0 exit criteria:** deployable book with 1 chapter + 1 widget, track switching reorders nav, search works, installs as PWA, offline-capable, all gates green, CI passing.

---

## Phase 1 — Research packets (parallel; cited)

Each task = one research team producing a structured packet file under `docs/research/`. Packets are the **source of truth** authors cite. Run as parallel agents (Workflow).

**Packet output contract (every packet):** Markdown file with, per topic: `claim`, `detail`, `source_url`/`source_tool`, `last_verified: 2026-06-21`, `confidence: high|med|low`. No uncited hard claims.

- [ ] **Task 1.1 — Claude Code feature surface** → `docs/research/packet-A-claude-code.md`. Method: `claude-code-guide` agent + official docs (WebFetch/context7). Cover: harness/agent loop, full tool surface, permissions/modes, hooks, slash commands, settings, output styles, subagents, workflows.
- [ ] **Task 1.2 — Ecosystem latest** → `docs/research/packet-B-ecosystem.md`. Method: WebSearch + `gh` GitHub search. Cover: plugins, marketplaces, MCP servers, skills, notable repos; each tagged with release recency + "newest to try."
- [ ] **Task 1.3 — Model/API/SDK facts** → `docs/research/packet-C-api.md`. Method: `claude-api` skill + context7. Cover: model ids, **pricing** (feeds `cost.ts`), capabilities, Agent SDK, caching, token counting.
- [ ] **Task 1.4 — Automation patterns** → `docs/research/packet-D-automation.md`. Method: `n8n-mcp` skills + WebSearch. Cover: n8n + GSuite (Gmail/Drive/Sheets/Calendar), Zapier MCP, scheduling (cron/loop/schedule), personal automation system patterns.
- [ ] **Task 1.5 — Mine local usage** → `docs/research/packet-E-usage.md`. Method: parse `~/.claude/projects/**/*.jsonl`, `~/.claude/history.jsonl`, `~/code/work/luxora/.remember/`, memories. Extract real patterns (parallel agents, worktrees, TDD, context discipline, long-running jobs, automations, prompting style). Produce **anonymized** case studies. **Redaction rule:** no secrets, tokens, client names, or PII enter the packet or the book.

**Exit:** 5 packets committed. After 1.3, update `src/lib/cost.ts` MODELS with verified prices; re-run `cost.test.ts`.

---

## Phase 2 — Widget production (TDD; parallel after Phase 0)

Each remaining widget = one task following this **fixed contract**:

> **Per-widget contract:** (a) pure logic in `src/lib/<name>.ts` with `src/lib/<name>.test.ts` written FIRST; (b) React component in `src/components/widgets/<Name>.tsx` consuming only that lib + tokens; (c) registered in `MDXComponents.tsx`; (d) a smoke render test; (e) commit `feat: <name> widget`.

**Worked example (the pattern to copy) — already done in Task 0.10 (Tokenizer):** lib `tokenizer.ts`/`cost.ts` TDD'd → `Tokenizer.tsx` → registered → chapter embed. Every widget below mirrors this exactly.

**Widget worklist:**

| # | Widget | `lib/` logic to TDD | Key behavior |
|---|---|---|---|
| 1 | HarnessExplorer | `harnessGraph.ts` (nodes/edges) | click node → detail; data-driven graph |
| 2 | ContextWindowSim | `contextSim.ts` (fill/compaction model) | add turns → bar fills; compaction triggers at threshold; lean vs bloated presets |
| 3 | AgentOrchestrationVisualizer | `orchestration.ts` (schedule sim) | sequential vs parallel wall-clock calc; worktree lanes; cost tiers |
| 4 | PromptLab | `promptScore.ts` (rule scorer) | score prompt on specificity/examples/constraints; before/after pairs; optional BYO-key live call (client fetch) |
| 5 | ToolSurfaceMap | `toolCatalog.ts` (from packet A) | searchable/filterable tool cards |
| 6 | Skill/Plugin/MCP Explorer | `ecosystem.ts` (from packet B) | filter by type/use-case; links |
| 7 | WorktreeWorkflowAnimator | `worktreeFlow.ts` (steps) | step-through flow states |
| 8 | TDDLoopVisualizer | `tddLoop.ts` (states) | red→green→refactor cycle w/ agent hooks |
| 9 | DecisionTrees | `decisionTree.ts` (tree walk) | "subagent/workflow/hook/skill?" Q&A → recommendation |
| 10 | Quiz | `quiz.ts` (scoring) | per-chapter MCQ from data; score + explanations |

(HarnessExplorer reuses Mermaid/Markmap where a static diagram suffices; build a custom interactive node map only where clicking adds value.)

- [ ] Tasks 2.1–2.10: one per row, each following the per-widget contract above. Data-driven widgets (ToolSurfaceMap, Explorer, Quiz) consume Phase-1 packets, so they run after their packet lands.

---

## Phase 3 — Content production (waves; parallel authoring + fact-check)

55 chapters per spec §6. Hand-writing 55 full MDX blocks here would be dishonest filler; instead every chapter is produced by an authoring agent under this **fixed contract + worked example + enumerated worklist**.

### Authoring contract (every chapter)
1. **Input:** the chapter row (below) + the relevant research packet(s).
2. **Frontmatter:** valid `ChapterMeta` (id, title, part, tracks{order}, difficulty, estMinutes, tags, summary).
3. **Body:** clear MDX. Persona-appropriate: First-Contact chapters plain-language with frequent small wins; Engineer chapters precise/technical; Automator chapters step-by-step + screenshots-as-figures. Use Callout/CodeBlock/Figure/Mermaid. Embed the widget(s) named in the row. Open with a 2-3 sentence "what you'll get"; close with a recap + "next."
4. **Citations:** every hard claim traces to a packet source (footnote or inline link). No uncited version numbers/prices/feature claims.
5. **Register** in `src/content/manifest.ts` with correct per-track orders (contiguous — coordinate so `manifest.test.ts` stays green).
6. **Gate:** chapter file builds; `manifest.test.ts` green.

### Worked example (pattern): `01-what-is-an-llm.mdx` — completed in Task 0.10. Every chapter below copies its shape.

### Chapter worklist
Each row → one authoring task. Columns: **id** · **part** · **tracks(order)** · **embed widgets** · **primary packet**.

**P0 Orientation**
- `how-to-use-this-book` · P0 · B1,E1,A1 · PathPicker · —
- `what-is-an-llm` · P0 · B2,E2,A2 · Tokenizer, ContextWindowSim · C,E *(done in 0.10; expand)*
- `what-is-claude` · P0 · B3,E3,A3 · CostCalculator · C
- `what-is-claude-code` · P0 · B4,E4,A4 · HarnessExplorer · A

**P1 First Contact** — `install-first-session` (B5,A5), `the-chat-loop` (B6), `permissions-and-safety` (B7,A6), `first-task-e2e` (B8). Widgets: ToolSurfaceMap (permissions). Packet A.

**P2 The Harness** — `agent-loop-anatomy` (B9-lite,E5; HarnessExplorer), `tool-surface` (E6,A7; ToolSurfaceMap), `permissions-modes-deep` (E7), `hooks` (E8,A8), `slash-commands` (E9,A9), `settings-env` (E10,A10). Packet A.

**P3 Context Engineering** — `context-window-budget` (E11,A11; ContextWindowSim), `compaction-autocompact` (E12; ContextWindowSim), `memory-claude-md` (E13,A12), `long-running-no-bloat` (E14; from packet E case studies), `docs-as-context` (E15,A13). Packets A,E.

**P4 Prompting & Spec** — `effective-prompting` (B10,E16,A14; PromptLab), `output-styles` (E17), `plan-an-idea` (E18,A15; DecisionTrees), `tdd-with-cheap-agents` (E19; TDDLoopVisualizer), `what-claude-expects-trust` (B11,E20,A16). Packets A,E.

**P5 Orchestration** — `subagents` (E21; AgentOrchestrationVisualizer), `parallel-agent-teams` (E22; AgentOrchestrationVisualizer), `workflows` (E23; DecisionTrees), `worktrees` (E24; WorktreeWorkflowAnimator), `cost-tiering` (E25,A17; CostCalculator). Packets A,E.

**P6 Dev Workflow E2E** — `offload-every-stage` (E26), `git-pr-cicd` (E27), `code-review-panels` (E28), `case-study-feature-ship` (E29; from packet E). Packets A,E.

**P7 Extending** — `skills-use-write` (E30,A18), `plugins-marketplaces` (E31,A19; Explorer), `mcp-use-build` (E32,A20; Explorer), `api-agent-sdk` (E33), `browser-ide-extensions` (E34,A21), `headless-cli` (E35,A22). Packets A,B,C.

**P8 Automation** — `automate-daily-tasks` (A23,E36), `n8n-gsuite` (A24), `zapier-mcp` (A25), `scheduling` (A26,E37; DecisionTrees), `personal-automation-system` (A27). Packet D.

**P9 Mastery** — `how-a-power-user-works` (E38,A28; from packet E), `maximizing-performance` (E39,A29; CostCalculator), `keeping-up-latest` (B12,E40,A30; Explorer), `delegation-maturity` (E41,A31). Packets B,E.

**P10 Reference** — `tool-reference` (B13,E42,A32; ToolSurfaceMap), `slash-command-reference` (E43,A33), `glossary` (B14,E44,A34), `model-pricing-tables` (E45,A35; CostCalculator), `links` (B15,E46,A36; Explorer). Packets A,B,C.

### Wave execution
- **Wave 1:** P0 + P1 (orientation + onboarding) — verify format/tone with the author before fanning further.
- **Wave 2:** P2 + P3 + P4 (engineer core).
- **Wave 3:** P5 + P6 (orchestration + dev workflow).
- **Wave 4:** P7 + P8 (extending + automation).
- **Wave 5:** P9 + P10 (mastery + reference).
- After each wave: rebuild search index, run all gates, commit.

### Fact-check pass (per wave)
- [ ] Reviewer agent cross-checks each chapter's hard claims against cited packets; flags/ softens unsupported claims; verifies no secrets/PII from packet E leaked. Commit fixes.

---

## Phase 4 — Integration & polish

- [ ] **Task 4.1:** Rebuild full search index over all chapters; verify ⌘K finds representative terms.
- [ ] **Task 4.2:** PWA audit — Lighthouse installable, offline loads cached chapters + search; icons/splash correct.
- [ ] **Task 4.3:** Accessibility + responsive pass (keyboard nav, focus states, mobile sidebar drawer, color contrast from tokens).
- [ ] **Task 4.4:** Landing + PathPicker polish; "resume" works; progress ticks accurate across tracks.
- [ ] **Task 4.5:** Final gates green; create GitHub repo `Bunty9/claude-book`, push, deploy to Vercel (static). Commit `chore: ship v1`.

---

## Self-Review (against spec)

- **Spec coverage:** §2 goals → Phases 0–4. §3 personas/tracks → Tasks 0.3/0.6/0.9 + frontmatter orders in Phase 3. §4 IA/shell → Phase 0.6/0.8. §5 content model → 0.3/0.4. §6 outline → Phase 3 worklist (all 11 parts present). §7 widgets (12) → Tokenizer (0.10) + 10 in Phase 2 + PathPicker (0.9) = 12. §8 architecture → Phase 0 config. §9 research → Phase 1. §10 orchestration → wave structure. §11 testing → Global Constraints + per-task gates. §12 open items → resolved (title kept; hand-port shell chosen; wave-based cut). No gaps.
- **Placeholder scan:** none ("TBD" only appears as a flagged price table awaiting Task 1.3, which is an explicit dependency, not a placeholder).
- **Type consistency:** `ChapterMeta`, `TrackId`, `chaptersForTrack`, `chapterById`, `prevNextFor`, `estimateTokens`, `costFor`, `MODELS` used consistently across tasks.

## Notes on parallel execution
Phase 0 is sequential (foundation). Phases 1, 2 (non-data-driven widgets), run in parallel after 0. Data-driven widgets + all Phase 3 chapters depend on their packets. Best executed via the **Workflow** tool: pipeline `packet → chapters citing it → fact-check`, fanning chapters within a wave.
