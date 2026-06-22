# Developer Guide — Claude, End to End

The long-form companion to [`CLAUDE.md`](../CLAUDE.md). `CLAUDE.md` is the quick agent-facing rulebook; this document explains the *why* and walks through every recurring task end to end.

---

## 1. What this project is

**Claude, End to End** is an interactive reference book that teaches Claude and Claude Code. It targets three reader personas — **beginner**, **engineer**, **automator** — who share a single pool of 53 chapters, each ordered differently per track.

It is a **fully static, offline-capable single-page app**:

- No backend, no database, no API routes, no server runtime.
- `next build` produces a folder of HTML/JS/CSS/JSON (`out/`) plus a service worker.
- All interactivity (search, progress, quizzes, simulators) runs in the browser; state persists in `localStorage`.
- Installable as a PWA and usable offline after first load.

Deployed at https://claude-book-one.vercel.app from the `master` branch of `github.com/Bunty9/claude-book`.

---

## 2. Tech stack and why

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js 16** App Router, `output: 'export'` | Static export — no Node server in prod. See `next.config.mjs`. |
| UI | **React 19** + **TypeScript** (strict) | No `as` / `!` / `any`; narrow with type guards. |
| Package manager | **pnpm** | `pnpm-lock.yaml` is the committed lockfile; CI uses `--frozen-lockfile`. |
| Styling | **Tailwind v4** (CSS config) + `@tailwindcss/typography` | No `tailwind.config.ts`; theme is declared with `@theme inline` in `globals.css`. |
| Content | **MDX** (`@next/mdx`) | Chapters are `.mdx`; React components usable inline. `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`. |
| Code blocks | **shiki** | Dual-theme highlighting via `CodeBlock.tsx`. |
| Diagrams | **mermaid** v11 | Wrapped by `Mermaid.tsx` (see §8). |
| Mind-maps | **markmap** | `Markmap.tsx`. |
| Search | **minisearch** | Client-side; index built from MDX at build time. |
| Offline | **@ducanh2912/next-pwa** | Generates the service worker on the webpack build only. |
| Fonts | **Geist** + **Geist Mono** (`@fontsource-variable`) | Self-hosted, no Google Fonts request. |
| Tests | **vitest** + Testing Library (jsdom) | 380 tests across 24 files. |

> **Read the `@AGENTS.md` warning:** Next.js 16 has breaking changes relative to most training data. When an App-Router/export API surprises you, check `node_modules/next/dist/docs/` rather than guessing.

---

## 3. Getting started

```bash
pnpm install
pnpm dev            # http://localhost:3000  (PWA disabled in dev)
```

Full verification (mirrors CI):

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Preview the real static output (service worker active):

```bash
pnpm build && pnpm preview   # serves out/ via `npx serve`
```

### Scripts

| Script | What it does |
| --- | --- |
| `dev` | `next dev` |
| `prebuild` | runs `build:search` automatically before `build` |
| `build` | `next build --webpack` → `out/` (with the search index already generated) |
| `build:search` | `node scripts/build-search-index.mjs` → `public/search-bodies.json` |
| `preview` | `npx serve out` |
| `typecheck` | `tsc --noEmit` |
| `lint` | `eslint src` |
| `test` / `test:watch` | vitest |

---

## 4. Repository layout

```
claude-book/
├─ CLAUDE.md                 # agent rulebook (imports AGENTS.md)
├─ AGENTS.md                 # Next.js-16 "not what you know" note
├─ docs/
│  ├─ development.md         # this file
│  └─ research/              # source research packets behind the chapters (A–E)
├─ scripts/
│  └─ build-search-index.mjs # MDX → public/search-bodies.json
├─ public/                   # static assets; search-*.json + sw.js are generated
├─ next.config.mjs           # export + MDX + PWA wiring
├─ vercel.json               # buildCommand: pnpm build, outputDirectory: out
└─ src/
   ├─ app/
   │  ├─ layout.tsx          # root: fonts, metadata, pre-paint theme script, Providers
   │  ├─ providers.tsx       # theme + track context (useSyncExternalStore)
   │  ├─ globals.css         # Tailwind v4 @theme inline + prose token overrides
   │  ├─ page.tsx            # home
   │  ├─ start/page.tsx      # track picker
   │  └─ (book)/             # authenticated-shell-style route group
   │     ├─ layout.tsx       # sidebar + topbar + TOC + search palette
   │     └─ c/[id]/
   │        ├─ page.tsx              # chapter page (generateStaticParams)
   │        ├─ chapterMdxRegistry.ts # id → lazy MDX import map
   │        └─ MarkDoneButton.tsx
   ├─ components/
   │  ├─ MDXComponents.tsx    # the MDX component map (pre→CodeBlock, tables, widgets)
   │  ├─ CodeBlock.tsx        # shiki + copy button
   │  ├─ Mermaid.tsx          # serialized mermaid renderer (§8)
   │  ├─ Markmap.tsx, Callout.tsx, Figure.tsx, PathPicker.tsx
   │  ├─ shell/              # Sidebar, TopBar, TOC, Breadcrumbs, PrevNext, SearchPalette, ThemeToggle, ProgressBadge
   │  └─ widgets/            # 11 interactive widgets (§7)
   ├─ content/
   │  ├─ manifest.ts          # ← source of truth: every chapter's metadata
   │  ├─ parts.ts             # P0–P10 → human labels
   │  ├─ types.ts             # ChapterMeta, TrackId, PartId
   │  └─ p0 … p10/            # the .mdx chapter files
   ├─ design/
   │  ├─ tokens.css           # oklch color/spacing/radius tokens (+ .light overrides)
   │  └─ tokens.test.ts
   └─ lib/                    # pure logic + hooks, each with a *.test.ts
      ├─ progress.ts, track.ts, recommendTrack.ts, prevNext.ts
      ├─ searchIndex.ts, searchData.ts
      ├─ labColor.ts          # lab() → rgb for mermaid (§8)
      ├─ cost.ts, tokenizer.ts, contextSim.ts, ecosystem.ts, harnessGraph.ts,
      │  orchestration.ts, promptScore.ts, quiz.ts, tddLoop.ts, toolCatalog.ts,
      │  decisionTree.ts, worktreeFlow.ts   ← logic backing each widget
      └─ useMounted.ts
```

---

## 5. Content model

### The manifest is the source of truth

`src/content/manifest.ts` exports `chapters: ChapterMeta[]`. Everything — sidebar, TOC, prev/next, search metadata, track ordering, progress totals — derives from it.

```ts
interface ChapterMeta {
  id: string                                  // stable unique slug (also the MDX filename and the URL /c/<id>/)
  title: string
  part: PartId                                // 'P0' … 'P10'
  tracks: Partial<Record<TrackId, number>>    // 1-based order within each track it belongs to
  difficulty: 1|2|3|4|5
  estMinutes: number
  tags: string[]
  summary: string
}
```

Helpers also exported from the manifest:

- `chapterById(id)` → `ChapterMeta | undefined`
- `chaptersForTrack(track)` → ordered `ChapterMeta[]` for one persona

### Parts

`P0` Orientation · `P1` First Contact · `P2` The Harness · `P3` Context Engineering · `P4` Prompting & Spec Engineering · `P5` Multi-Agent Orchestration · `P6` The Dev Workflow · `P7` Extending Claude · `P8` Automation & Integrations · `P9` Mastery & Power User · `P10` Reference. Labels live in `src/content/parts.ts`.

### Tracks

`beginner` | `engineer` | `automator` (`src/content/types.ts`). One chapter can appear in several tracks at different positions — the `tracks` map encodes per-track order. `recommendTrack.ts` powers the `/start` picker; the selected track is stored in `cb:track`.

---

## 6. How a chapter page renders

1. `app/(book)/c/[id]/page.tsx` calls `generateStaticParams()` → one static route per `chapters[].id` (`dynamicParams = false`, so unknown ids 404 at build).
2. The page looks up metadata with `chapterById(id)` and the MDX component via `chapterMdxRegistry.ts`.
3. `chapterMdxRegistry.ts` is an **explicit** `Record<id, () => import('…mdx')>`. It is intentionally explicit (not a computed/template import) so Next's static-export bundler can analyse every branch. A missing id renders a "coming soon" placeholder; a manifest id with no registry entry fails `lib/chapterRegistry.test.ts`.
4. MDX is rendered through the component map in `src/components/MDXComponents.tsx` (wired into MDX by `src/mdx-components.tsx`'s `useMDXComponents`):
   - `pre` is intercepted → routes fenced code through `CodeBlock` (shiki + copy). Inline `` `code` `` keeps the global chip style.
   - `table`/`thead`/`th`/`tr`/`td` get token-styled, horizontally scrollable wrappers.
   - All widgets + `Callout`, `Figure`, `Mermaid`, `Markmap`, `PathPicker` are exposed as MDX components, usable by name in any `.mdx`.

### Adding a chapter (3 required edits)

1. **Metadata** — add a `ChapterMeta` to `src/content/manifest.ts`.
2. **Content** — create `src/content/pN/<id>.mdx`.
3. **Registry** — add `'<id>': () => import('@/content/pN/<id>.mdx')` to `chapterMdxRegistry.ts`.

Then run `pnpm build:search` (or `pnpm build`) to index the new body. Verify with `pnpm test` — `chapterRegistry.test.ts` and `manifest.test.ts` enforce parity and metadata validity.

---

## 7. Interactive widgets

The 11 widgets live in `src/components/widgets/`:

`Tokenizer`, `HarnessExplorer`, `ContextWindowSim`, `AgentOrchestrationVisualizer`, `PromptLab`, `ToolSurfaceMap`, `EcosystemExplorer`, `WorktreeWorkflowAnimator`, `TDDLoopVisualizer`, `DecisionTrees`, `Quiz`.

**The pattern — separate logic from presentation:**

- **Logic → `src/lib/<name>.ts`**, fully unit-tested in `src/lib/<name>.test.ts`. All scoring, graph building, filtering, branching, and data shaping go here so they can be tested without rendering. Examples: `tokenizer.ts`, `promptScore.ts`, `orchestration.ts`, `harnessGraph.ts`, `decisionTree.ts`, `toolCatalog.ts`, `worktreeFlow.ts`, `tddLoop.ts`, `contextSim.ts`, `ecosystem.ts`, `quiz.ts`, `cost.ts`.
- **Presentation → `src/components/widgets/<Name>.tsx`**, a thin client component over the lib.
- **Registration → `src/components/MDXComponents.tsx`**, then use `<Name />` in MDX.

To add a widget: write `lib/<name>.ts` + its test → build `widgets/<Name>.tsx` → register in `MDXComponents.tsx` → drop `<Name />` into a chapter.

---

## 8. Diagrams: the two Mermaid gotchas

`src/components/Mermaid.tsx` exists because two real problems bite anyone who renders mermaid here:

### 8.1 Color parsing (`lib/labColor.ts`)

Design tokens are authored in `oklch`. When read back via `getComputedStyle().color`, this Chromium engine returns `lab(...)`. Mermaid's color engine (**khroma**) cannot parse `lab()` or `oklch()` and throws at render time. So:

- `Mermaid.tsx` resolves each theme CSS variable through a hidden probe span, then converts the resulting `lab(...)` to `rgb(...)` with `labToRgb` from `lib/labColor.ts` (CIELAB → XYZ D50 → linear sRGB → gamma).
- Never hand mermaid a raw CSS-var color. Add new theme variables to `readTokens()` and let `resolveColor` convert them.

### 8.2 The global-singleton render race

Mermaid is a global singleton: `initialize()` mutates shared config and `render()` manipulates a shared DOM sandbox. Multiple `<Mermaid>` instances on one page (e.g. re-rendering together on a theme toggle) can interleave and corrupt each other's output. The fix in `Mermaid.tsx`:

- Load the library once (cached import promise).
- Run every `parse`+`render` through a single module-level promise queue (mutex) — they never interleave across instances.
- Call `initialize()` only when the theme-token signature changes.
- Read tokens *inside* the serialized critical section so a render queued during a theme toggle picks up fresh colors.

**Do not** reintroduce a per-instance `mermaid.initialize()` inside the component effect.

---

## 9. Theming and design tokens

- Tokens (`src/design/tokens.css`): all colors (oklch), radii, spacing as CSS custom properties. A `.light` block overrides the dark defaults.
- `globals.css` maps tokens to Tailwind utility names with `@theme inline` (`--color-bg: var(--bg)` → `bg-bg`, etc.) and overrides `.prose` typography variables. **Write utilities (`text-fg-muted`, `border-border`, `bg-accent-subtle`), never hex.**
- Dark is the default. The `.light` class on `<html>` is:
  - pre-applied by a **blocking inline script** in `app/layout.tsx` (reads `cb:theme` before first paint → no flash), and
  - kept in sync at runtime by an effect in `app/providers.tsx`.
- `tokens.test.ts` guards that required tokens exist.

---

## 10. State, persistence, and SSR-safety

Three `localStorage` keys, all prefixed `cb:`:

| Key | Meaning | Module |
| --- | --- | --- |
| `cb:progress` | JSON array of completed chapter ids | `lib/progress.ts` |
| `cb:track` | selected reader track | `lib/track.ts` |
| `cb:theme` | `'light'` \| `'dark'` | `app/providers.tsx` |

**Reactivity without a global store:** writers persist to `localStorage` and dispatch a custom window event (`cb:progress`, `cb:track`, `cb:theme`); readers subscribe. `progress.ts` exposes `useProgressVersion()`; `providers.tsx` reads theme/track via `useSyncExternalStore` (also listening to the native `storage` event for cross-tab sync).

**Why `useSyncExternalStore` matters here:** the app statically exports, so the server snapshot and the first client hydration render must produce identical markup. A lazy `useState(() => localStorage.getItem(...))` reads the client value and mismatches the server default → hydration error. `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` returns the server snapshot during SSR and first hydration, then switches to the live value — no mismatch, and no `setState`-in-effect (which the react-hooks lint rule rejects as an error). `<html>` keeps `suppressHydrationWarning` because the pre-paint script legitimately mutates its class before hydration.

All direct `localStorage`/`window` access is guarded with `typeof window === 'undefined'`.

---

## 11. Search

Two-stage, fully client-side:

1. **Build time** — `scripts/build-search-index.mjs` walks `src/content/**.mdx`, strips MDX/markdown markup, and writes `{ id → plaintext }` to `public/search-bodies.json`. Runs automatically via `prebuild`.
2. **Run time** — `lib/searchData.ts` fetches that JSON and joins it with manifest metadata (title/summary/part are authoritative from the manifest; body from the JSON) to build `SearchDoc[]`; `lib/searchIndex.ts` feeds minisearch. The UI is `components/shell/SearchPalette.tsx`.

Never hand-edit `public/search-bodies.json` — it is generated.

---

## 12. PWA / offline

`@ducanh2912/next-pwa` wraps the config in `next.config.mjs` (`dest: 'public'`, disabled in dev). On `pnpm build` it emits the service worker and workbox runtime.

- **Critical:** the SW is only generated on the **webpack** build (`next build --webpack`). Do not switch to Turbopack — it silently skips the SW and breaks offline. **Always confirm `out/sw.js` exists after a build.**
- `public/sw.js`, `public/workbox-*.js`, and the whole `out/` tree are gitignored build artifacts.
- App manifest: `public/manifest.webmanifest`, icons in `public/icons`, theme color set in `app/layout.tsx`'s `viewport`.

---

## 13. Testing

- vitest + Testing Library, jsdom environment (`vitest.config.ts`, `vitest.setup.ts`). `@` resolves to `src/`.
- 380 tests / 24 files. Coverage is heaviest on `lib/` (pure logic) and the content invariants:
  - `content/manifest.test.ts` — metadata validity (unique ids, valid parts/tracks).
  - `lib/chapterRegistry.test.ts` — every manifest id has a registry entry and vice-versa.
  - `lib/smoke.test.ts` — broad sanity.
  - each widget's logic module has a matching `*.test.ts`.
- Run one file: `pnpm vitest run src/lib/labColor.test.ts`. By name: `pnpm vitest run -t "lab"`.
- **TDD is the norm for widget logic:** write the `lib` test first, implement, then build the component.

---

## 14. CI / CD

- **CI** (`.github/workflows`): on push to `master`/`main` and on every PR — `pnpm install --frozen-lockfile` then `typecheck` → `test` → `lint` → `build`. There are no escape hatches; all four must pass.
- **CD**: Vercel is connected to the repo and builds with `pnpm build` / outputs `out/` (`vercel.json`). Push to `master` → Vercel production deploy. Manual: `npx vercel deploy --prod --yes`. Production alias: `claude-book-one.vercel.app`.

After deploying, sanity-check `/`, a chapter (`/c/<id>/`), and `/sw.js` all return 200.

---

## 15. Conventions and rules (summary)

- **TypeScript strict, no `as` / `!` / `any`.** Narrow with type guards; see `MDXComponents.tsx` and `lib/track.ts`.
- **pnpm only.** Commit `pnpm-lock.yaml`; CI is `--frozen-lockfile`.
- **Conventional commits**; author must be `Bunty9 <cbipin2000@gmail.com>`; **no AI-attribution** lines anywhere.
- **No secrets / tokens / client names / PII** in content or code — public repo, public site.
- **Don't commit build artifacts** (`out/`, `public/sw.js`, `public/workbox-*.js`, `next-env.d.ts`, `*.tsbuildinfo`).
- **Keep the build on webpack** so the PWA service worker ships.
- Use design tokens, not hex. Keep widget logic in `lib`, presentation in `components/widgets`.

---

## 16. Where things live (quick index)

| I want to… | Go to |
| --- | --- |
| Add/edit a chapter's text | `src/content/pN/<id>.mdx` |
| Change a chapter's metadata/order/track | `src/content/manifest.ts` |
| Register a new chapter for routing | `src/app/(book)/c/[id]/chapterMdxRegistry.ts` |
| Add an interactive widget | `src/lib/<name>.ts` (+test) → `src/components/widgets/<Name>.tsx` → `MDXComponents.tsx` |
| Change colors/spacing/theme | `src/design/tokens.css` (+ `globals.css` mapping) |
| Touch diagram rendering | `src/components/Mermaid.tsx` (+ `src/lib/labColor.ts`) |
| Change the page shell (sidebar/TOC/search) | `src/components/shell/*`, `src/app/(book)/layout.tsx` |
| Theme / track persistence | `src/app/providers.tsx`, `src/lib/track.ts`, `src/lib/progress.ts` |
| Search behavior | `scripts/build-search-index.mjs`, `src/lib/searchData.ts`, `src/lib/searchIndex.ts` |
| Build / export / PWA config | `next.config.mjs`, `vercel.json` |
| Source research behind the content | `docs/research/packet-*.md` |
