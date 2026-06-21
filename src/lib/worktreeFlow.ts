/**
 * worktreeFlow.ts — pure, deterministic data and logic for the WorktreeWorkflowAnimator widget.
 *
 * Models the feature-per-worktree development lifecycle as a linear sequence of
 * named steps, each carrying display metadata and guard conditions.
 *
 * All exports are pure functions and constant data — no side-effects, safe to
 * import in server or client components.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepId =
  | 'detached-main'
  | 'create-worktree'
  | 'isolated-work'
  | 'commit'
  | 'open-pr'
  | 'review-merge'
  | 'cleanup'

export type StepRole = 'surface' | 'accent' | 'tip' | 'warning' | 'note' | 'danger'

export interface WorktreeStep {
  readonly id: StepId
  /** Short title shown in the step indicator */
  readonly title: string
  /** One-sentence summary used in compact views */
  readonly summary: string
  /** Full explanation shown in the detail panel */
  readonly description: string
  /** Illustrative shell command (if applicable) */
  readonly command: string | null
  /** Token semantic colour role */
  readonly role: StepRole
  /** Gotcha / anti-pattern to avoid at this step */
  readonly pitfall: string | null
}

export interface FlowState {
  /** Zero-based index of the current step */
  readonly currentIndex: number
  /** Total number of steps in the flow */
  readonly totalSteps: number
}

// ---------------------------------------------------------------------------
// Step definitions — grounded in packet-E-usage.md § Section 4 (Worktree Discipline)
// and the CLAUDE.md worktree guide references.
// ---------------------------------------------------------------------------

export const WORKTREE_STEPS: readonly WorktreeStep[] = [
  {
    id: 'detached-main',
    title: 'Main Checkout — Detached at origin/dev',
    summary: 'The main checkout is never a workspace; it stays pinned to origin/dev.',
    description:
      'Both active repos (cdp-backend/ and cdp-frontend/) keep their main checkouts ' +
      'detached at origin/dev at all times. This is a structural invariant enforced by a ' +
      'SessionStart hook that runs `lux-wt brief` and warns if the checkout has drifted ' +
      'onto a branch, gone dirty, or fallen off origin/dev. You never edit files here; ' +
      'you never git checkout a branch here. The main checkout is a clean reference point ' +
      'and nothing else.',
    command: null,
    role: 'surface',
    pitfall:
      'Never run `git checkout <branch>` in the main checkout. That is exactly how ' +
      'feature branches end up hundreds of commits behind dev.',
  },
  {
    id: 'create-worktree',
    title: 'Create Worktree via lux-wt.sh',
    summary: 'One command spins up an isolated directory based on the latest origin/dev.',
    description:
      'The script `./scripts/lux-wt.sh new <be|fe> <branch-name>` creates a new Git ' +
      'worktree under cdp-backend-worktrees/ or cdp-frontend-worktrees/, always basing ' +
      'on origin/dev (never on the current checkout HEAD). It then runs `npm ci` and ' +
      '`prisma generate` inside the new directory, and copies the .env file so the ' +
      'worktree is immediately runnable. Each worktree also gets its own isolated ' +
      '~/.claude/projects/ entry, so session memory is scoped per feature branch.',
    command: './scripts/lux-wt.sh new be feat/my-feature',
    role: 'accent',
    pitfall:
      'Never run `git worktree add` by hand — it bypasses the base-on-origin/dev ' +
      'guarantee and can silently create a worktree 300+ commits stale.',
  },
  {
    id: 'isolated-work',
    title: 'Work in Isolation',
    summary: 'All edits, tests, and tool calls happen inside the worktree directory.',
    description:
      'The worktree is a full, independent working tree: it has its own index, its own ' +
      'HEAD, and its own node_modules (from the npm ci step). You can run the dev server ' +
      'on a different port, run vitest, and edit files — all without touching the main ' +
      'checkout or any other worktree. Claude Code sessions in this directory are isolated: ' +
      'the session JSONL, memory files, and tool calls are all scoped to this branch. ' +
      'Up to ~5 parallel agents can work on disjoint file scopes within a single session; ' +
      'files that overlap must be serialised.',
    command: 'cd cdp-backend-worktrees/feat/my-feature && pnpm dev',
    role: 'tip',
    pitfall:
      'If two agents edit the same file concurrently, you get a merge conflict inside ' +
      'the worktree. Split scope carefully — disjoint modules, not disjoint lines.',
  },
  {
    id: 'commit',
    title: 'Commit Changes',
    summary: 'Conventional commits, code-only — no docs or .md files.',
    description:
      'Inside the worktree, commit with conventional commit messages: `feat:`, `fix:`, ' +
      '`chore:`, `refactor:`. A PreToolUse hook (`verify-commit.sh`) intercepts every ' +
      'git commit Bash call and blocks it if the author identity is wrong or if the ' +
      'message contains AI-attribution strings. Commits must include the updated ' +
      'package-lock.json when deps change (pnpm-only changes break CI). Never commit ' +
      '.md files or docs/ — spec documents live in the parent ~/code/work/luxora/docs/ ' +
      'directory which is not a git repo.',
    command: 'git commit -m "feat: add worktree flow widget"',
    role: 'warning',
    pitfall:
      'Adding a dependency via `pnpm add` updates pnpm-lock.yaml only. Always also run ' +
      '`npm install --package-lock-only` and commit package-lock.json in the same change.',
  },
  {
    id: 'open-pr',
    title: 'Open PR to dev',
    summary: 'PR targets dev, not main — the branch model has a strict target rule.',
    description:
      'PRs from feature branches always target the `dev` branch. The PR description ' +
      'references spec documents by local path (e.g. `docs/superpowers/specs/…`) rather ' +
      'than committing them. After opening, the pr-review-toolkit skill is typically ' +
      'invoked to run a multi-agent code review pass before requesting human review. ' +
      'The smoke.yml CI workflow runs typecheck + lint + build on PR creation; note that ' +
      'cdp-frontend CI has `NEXT_IGNORE_BUILD_ERRORS` escape hatches — local typecheck ' +
      'is the real gate.',
    command: 'gh pr create --base dev --title "feat: my feature"',
    role: 'note',
    pitfall:
      'Never target `main` or `gcp` directly from a feature branch. The only path to ' +
      'gcp is: feature → dev → gcp (promote). Auto-CD fires on push to gcp; never ' +
      'trigger it manually.',
  },
  {
    id: 'review-merge',
    title: 'Review & Merge',
    summary: 'PR review, merge to dev, then promote dev → gcp for deployment.',
    description:
      'After PR review (human or multi-agent toolkit), the PR is merged into dev. ' +
      'Run `gh pr merge` from the main checkout, not the worktree being merged — ' +
      'otherwise `--delete-branch` aborts. To deploy, promote dev → gcp by merging ' +
      'in the gcp-promote worktree: `git checkout gcp && git merge dev && git push`. ' +
      'Auto-CD (Cloud Build, asia-south1 regional pool) fires automatically on that ' +
      'push. Verify the deploy from the cluster (kubectl -n luxora get deploy), the ' +
      'kustomization.yaml newTag, and the deploy marker commit — never from gcloud ' +
      'builds list without --region=asia-south1.',
    command: 'gh pr merge --merge --delete-branch',
    role: 'tip',
    pitfall:
      'Running `gh pr merge` from inside the worktree that is being deleted causes ' +
      '`--delete-branch` to abort. Switch to the main checkout first.',
  },
  {
    id: 'cleanup',
    title: 'Remove Worktree',
    summary: 'After merge, remove the worktree directory and prune the local branch.',
    description:
      'Once the PR is merged, the worktree can be removed. `lux-wt clean` prunes ' +
      'worktrees whose branches are no longer tracked remotely. Removing the worktree ' +
      'directory also removes the isolated Claude session context — the remember plugin ' +
      'has already extracted the session summary into the memory files, so nothing is ' +
      'lost. The main checkout remains detached at origin/dev, ready for the next ' +
      'feature cycle to begin again from step 1.',
    command: './scripts/lux-wt.sh clean',
    role: 'surface',
    pitfall: null,
  },
]

// ---------------------------------------------------------------------------
// Derived constants
// ---------------------------------------------------------------------------

export const STEP_COUNT = WORKTREE_STEPS.length

export const STEP_IDS: readonly StepId[] = WORKTREE_STEPS.map(s => s.id)

// ---------------------------------------------------------------------------
// Pure query helpers
// ---------------------------------------------------------------------------

/** Return the step at a given zero-based index, or undefined if out-of-range. */
export function stepAt(index: number): WorktreeStep | undefined {
  return WORKTREE_STEPS[index]
}

/** Return the zero-based index of the step with the given id, or -1 if not found. */
export function indexOfStep(id: StepId): number {
  return WORKTREE_STEPS.findIndex(s => s.id === id)
}

/** Return a new FlowState advanced by one step, clamped at the last step. */
export function advance(state: FlowState): FlowState {
  return {
    currentIndex: Math.min(state.currentIndex + 1, state.totalSteps - 1),
    totalSteps: state.totalSteps,
  }
}

/** Return a new FlowState retreated by one step, clamped at zero. */
export function retreat(state: FlowState): FlowState {
  return {
    currentIndex: Math.max(state.currentIndex - 1, 0),
    totalSteps: state.totalSteps,
  }
}

/** Return a new FlowState jumped to a specific index, clamped to valid range. */
export function jumpTo(state: FlowState, index: number): FlowState {
  const clamped = Math.max(0, Math.min(index, state.totalSteps - 1))
  return { currentIndex: clamped, totalSteps: state.totalSteps }
}

/** Return true when the state is at the first step. */
export function isFirst(state: FlowState): boolean {
  return state.currentIndex === 0
}

/** Return true when the state is at the last step. */
export function isLast(state: FlowState): boolean {
  return state.currentIndex === state.totalSteps - 1
}

/** Build the initial FlowState. */
export function initialFlowState(): FlowState {
  return { currentIndex: 0, totalSteps: STEP_COUNT }
}

/** Return a human-readable progress label, e.g. "Step 2 of 7". */
export function progressLabel(state: FlowState): string {
  return `Step ${state.currentIndex + 1} of ${state.totalSteps}`
}
