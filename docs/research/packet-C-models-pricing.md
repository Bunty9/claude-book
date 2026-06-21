# Packet C — Models, API & Pricing

> Research packet backing the pricing/model claims in the book (chapters
> `model-pricing-tables`, `cost-tiering`, `api-agent-sdk`, and the `Tokenizer`
> cost widget / `src/lib/cost.ts`). Regenerated in-session on **2026-06-21**
> after the workflow's original packet-C run failed (1M-context credit gate).
> All figures are list prices from official Anthropic documentation on the
> access date below. **Prices change — reconfirm before quoting a budget.**

## Model family (current generation)

| Model id | Tier | Context window | Modalities | Best for |
|---|---|---|---|---|
| `claude-fable-5` | Fable | 1M | text, image, tool use | Frontier reasoning, largest jobs |
| `claude-opus-4-8` | Opus | 1M | text, image, tool use | Hardest reasoning, long-horizon agents |
| `claude-sonnet-4-6` | Sonnet | 1M | text, image, tool use | Balanced quality/speed — everyday default |
| `claude-haiku-4-5` | Haiku | 200k | text, image, tool use | High-volume, latency-sensitive tasks |

Also live per the pricing page: `claude-mythos-5` (limited availability),
`claude-opus-4-7`, `claude-opus-4-6`, `claude-opus-4-5`, `claude-sonnet-4-5`.
Deprecated/retired (keep old rates): `claude-opus-4-1`, `claude-opus-4`,
`claude-sonnet-4`, `claude-haiku-3-5`. [1][2]

**Verification of the book's "latest" ids:** Opus 4.8, Sonnet 4.6, Haiku 4.5,
and Fable 5 are all **real, current public ids** on the official pricing page. [1]
(The book's environment also names them as the latest models; the web confirms it.)

**Tokenizer note:** Opus 4.7 and later use a new tokenizer that can use up to
~35% more tokens for the same text. Budget in tokens, not characters, across tiers. [1]

## Pricing (USD per million tokens, MTok)

| Model | Input | Output | 5m cache write | 1h cache write | Cache read |
|---|---|---|---|---|---|
| claude-fable-5 | $10.00 | $50.00 | $12.50 | $20.00 | $1.00 |
| claude-opus-4-8 | $5.00 | $25.00 | $6.25 | $10.00 | $0.50 |
| claude-opus-4-7 | $5.00 | $25.00 | $6.25 | $10.00 | $0.50 |
| claude-opus-4-6 | $5.00 | $25.00 | $6.25 | $10.00 | $0.50 |
| claude-opus-4-5 | $5.00 | $25.00 | $6.25 | $10.00 | $0.50 |
| claude-sonnet-4-6 | $3.00 | $15.00 | $3.75 | $6.00 | $0.30 |
| claude-sonnet-4-5 | $3.00 | $15.00 | $3.75 | $6.00 | $0.30 |
| claude-haiku-4-5 | $1.00 | $5.00 | $1.25 | $2.00 | $0.10 |
| claude-opus-4-1 (deprecated) | $15.00 | $75.00 | $18.75 | $30.00 | $1.50 |
| claude-haiku-3-5 (retired) | $0.80 | $4.00 | $1.00 | $1.60 | $0.08 |

All rows from the official pricing table. [1]

**Cache multipliers** (relative to base input): 5-minute write = 1.25×,
1-hour write = 2×, cache read (hit) = 0.1×. A 5m cache pays off after one reuse;
a 1h cache after two. Multipliers stack with the Batch discount and data residency. [1]

## Discounts & premiums

- **Batch API** — 50% off both input and output (e.g. Opus 4.8 batch = $2.50 / $12.50;
  Sonnet 4.6 = $1.50 / $7.50; Haiku 4.5 = $0.50 / $2.50). Not combinable with Fast mode. [1]
- **1M-token context** — Fable 5, Opus 4.8/4.7/4.6, Sonnet 4.6 include the full 1M
  window at standard per-token pricing (a 900k request bills at the same rate as 9k).
  Enabling 1M context can require credits on the account (observed in this environment). [1]
- **Fast mode** (research preview, Opus only) — Opus 4.8 $10 / $50; Opus 4.6–4.7
  $30 / $150 per MTok. Applies across the full context window; not on Batch API. [1]
- **Data residency** (`inference_geo: "us"`, Opus 4.6 / Sonnet 4.6 and later) —
  1.1× on all token categories. Global routing (default) is standard price. [1]

## Server-tool & feature pricing (selected)

- **Web search** — $10 per 1,000 searches + token costs. **Web fetch** — no extra charge. [1]
- **Code execution** — free when used with web search/fetch; otherwise billed by
  container time ($0.05/hr/container, 1,550 free hours/month, 5-min minimum). [1]
- **Tool-use system-prompt overhead** (added input tokens, `auto`/`none`): Opus 4.8 ≈ 290,
  Sonnet 4.6 ≈ 497, Haiku 4.5 ≈ 496; bash +245, text-editor +700, computer-use +735. [1]
- **Token rule of thumb** — ~1 token ≈ 4 chars ≈ 0.75 English words (official FAQ). [1]

## Access tiers (subscription vs API)

- **API pay-as-you-go** — billed on actual monthly token usage at the rates above;
  usage tiers 1–4 + Enterprise govern rate limits, not price. New users get a small
  free credit grant. [1][3]
- **Pro / Max plans** — flat-rate Claude (and Claude Code) access for individuals;
  higher usage ceilings on Max. Plan/price specifics live at claude.com/pricing and
  change often — treat the page as source of truth rather than hardcoding here. [3]
- **Cloud platforms** — Amazon Bedrock & Google Vertex AI bill through the provider;
  regional/multi-region endpoints add a 10% premium vs global. Claude Platform on AWS
  meters in Claude Consumption Units (100 CCU = $1.00). [1]

## Gotchas / recently changed

- **Don't reuse old Opus/Haiku numbers.** $15/$75 is **deprecated Opus 4.1**, and
  $0.80/$4 is **retired Haiku 3.5** — current Opus 4.8 is $5/$25 and Haiku 4.5 is $1/$5.
  (This was the exact bug found in `cost.ts` and the pricing chapter; now fixed.)
- 1M context is gated behind credits in some accounts — spawning agents on a 1M-context
  model can fail with a credit error (hit during this book's own build).
- Opus 4.7+ tokenizer change (~+35% tokens) makes char-based budgeting under-count.

## Sources

1. [Pricing — Claude API Docs](https://platform.claude.com/docs/en/about-claude/pricing) — accessed 2026-06-21.
2. [Models overview — Claude API Docs](https://platform.claude.com/docs/en/about-claude/models/overview) — accessed 2026-06-21.
3. [Plans & Pricing | Claude by Anthropic](https://claude.com/pricing) — accessed 2026-06-21.
