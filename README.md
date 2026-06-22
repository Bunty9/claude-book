# Claude, End to End

An interactive, offline-capable reference book that teaches **Claude** and **Claude Code** to three reader personas — beginner, engineer, and automator. 53 chapters, 11 interactive widgets, client-side search, and per-reader progress tracking.

🔗 **Live:** https://claude-book-one.vercel.app

It's a fully static Next.js SPA + PWA — no backend, no database. `next build` produces a folder of static files plus a service worker, so it installs and works offline after first load.

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Verify like CI does:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Preview the real static output (service worker active):

```bash
pnpm build && pnpm preview
```

## Stack

Next.js 16 (App Router, static export) · React 19 · TypeScript (strict) · Tailwind v4 · MDX · shiki · mermaid · markmap · minisearch · next-pwa · vitest. Package manager: **pnpm**.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server on :3000 (PWA disabled) |
| `pnpm build` | Production static build → `out/` (runs the search-index step first) |
| `pnpm preview` | Serve `out/` locally |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `eslint src` |
| `pnpm test` / `pnpm test:watch` | vitest |
| `pnpm build:search` | Rebuild the client search index |

## Project layout

```
src/
  app/        routes + layouts (root, (book) shell, /, /start, /c/[id])
  content/    manifest.ts (source of truth) + p0…p10/*.mdx chapters
  components/ MDX map, CodeBlock, Mermaid, shell/, widgets/
  lib/        pure logic + hooks (each with a *.test.ts)
  design/     oklch design tokens
scripts/      build-search-index.mjs
docs/         development.md (full guide) + research/
```

## Contributing

- **Add a chapter:** add a `ChapterMeta` to `src/content/manifest.ts`, create `src/content/pN/<id>.mdx`, and register the import in `src/app/(book)/c/[id]/chapterMdxRegistry.ts`.
- **Add a widget:** put the logic in `src/lib/<name>.ts` (with tests), the UI in `src/components/widgets/<Name>.tsx`, and register it in `src/components/MDXComponents.tsx`.
- TypeScript strict — no `as` / `!` / `any`. Use design tokens, not hex. Conventional commits.

See **[`docs/development.md`](docs/development.md)** for the full developer guide and **[`CLAUDE.md`](CLAUDE.md)** for the agent rulebook.
