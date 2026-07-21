# Master Execution Plan — Eunoia Intelligence Platform

**Date:** 2026-06-18
**Status:** Roadmap and recommendations only. No implementation has started from this document.

This is the execution sequence following `FINAL_PLATFORM_AUDIT.md` (architecture/module/debt/security review) and `SERPAPI_MIGRATION_PLAN.md` (the technical fix for the platform's #1 blocker). It also contains the revenue-model decision the audit flagged as needed before Priority 1 work can be specified precisely.

---

## Revenue Model Review

**Decision: Hybrid — Subscription tiers with an included monthly report allotment, plus purchasable overage credits.**

### Why not the alternatives

- **Pure Pay-Per-Report:** simplest to bolt on (Stripe Checkout per report, no subscription billing logic) but it's the wrong model for a product whose value compounds with repeated use (lead lists get stale, need refreshing). Every use becoming a new purchase decision maximizes friction and caps revenue ceiling — bad for retention and for predictable revenue planning.
- **Pure Credits:** good cost-pass-through fit (variable per-search cost), but standing alone it abandons the recurring-revenue motion entirely and discards the `Workspace.plan`/`PLAN_LIMITS` design work already in the codebase (`types/workspace.types.ts`) — that's real, unenforced design intent worth honoring rather than replacing.
- **Pure Subscription (flat, unlimited-feeling tiers):** matches what's already half-built (`PLAN_LIMITS`), but exposes margin to abuse — a single high-volume Enterprise tenant could consume enough SerpAPI/OpenAI cost to erode the plan's margin with no automatic brake.

### Why Hybrid fits this specific platform

1. **It reuses existing design, not replaces it.** `PLAN_LIMITS` already defines `reportsPerMonth` per tier (Starter 20, Professional 100, Enterprise unlimited) — the only gap is enforcement and an overage path. This is the smallest delta from current code, consistent with the "prefer reuse" instruction governing this whole review.
2. **The unit economics support it.** Per-report variable cost is low and dominated by the search call: one SerpAPI search (≈$0.01-0.015 per the estimate in `SERPAPI_MIGRATION_PLAN.md` §5) plus a `gpt-4o-mini` summarization call (`services/legacy-ai-engine/providers/openai.provider.ts`'s published rates: $0.00015/1K input tokens, $0.0006/1K output tokens — a few cents at most for a short summarization prompt). All-in, a Lead Finder report likely costs low single-digit cents to produce. That headroom comfortably supports generous included-report allotments in paid tiers while still leaving room for healthy gross margin.
3. **Overage credits cap the downside.** Once a workspace exceeds its plan's included reports, additional reports draw from a purchased credit balance rather than running uncapped against the company's SerpAPI/OpenAI bill — this is the piece that's missing from a pure-subscription model and is cheap to add given the report-count tracking already implied by `PLAN_LIMITS.reportsPerMonth`.
4. **Enterprise "unlimited" remains sellable without being a literal blank check** — define it as "unlimited within fair-use, soft-capped with an account-team conversation past a high threshold," rather than a hard promise with no ceiling, given the now-metered cost of every search.

### Revenue potential and cost structure (illustrative, not a market forecast)

No external market sizing or competitor pricing research was performed as part of this review — the figures below are unit-economics math from known costs, not a revenue forecast. Treat them as a starting point for a pricing experiment, not a committed number.

| Plan | Included reports/mo | Illustrative price | Est. variable cost (at ~$0.02/report all-in) | Illustrative gross margin |
|---|---|---|---|---|
| Starter | 20 | TBD — price-test | ~$0.40/mo | Very high if priced above ~$10-20/mo |
| Professional | 100 | TBD — price-test | ~$2.00/mo | Very high if priced above ~$50-100/mo |
| Enterprise | Soft-unlimited | TBD — sales-led | Scales with usage | Needs per-account margin monitoring past the fair-use threshold |

The headline point: **at these unit costs, pricing is not cost-constrained, it's market-constrained.** The business should set prices based on willingness-to-pay and competitive positioning, not based on covering SerpAPI/OpenAI spend — that spend is a rounding error against any plausible B2B SaaS price point for "evidence-backed lead lists." The risk to manage is abuse/runaway usage (covered by the overage-credit cap and the plan-aware rate limiting in Priority 1 below), not unit margin.

---

## Roadmap

Ordered Priority 1 (revenue-critical, do first) through Priority 5 (future expansion, do last). ROI Score is a 1-10 heuristic blending business impact against implementation effort — not a formula, a sequencing aid.

### Priority 1 — Revenue-Critical

| # | Task | Business Impact | Technical Impact | Est. Hours | Dependencies | ROI |
|---|---|---|---|---|---|---|
| 1.1 | **SerpAPI migration** (per `SERPAPI_MIGRATION_PLAN.md`) | Unblocks the platform's only sellable, evidence-based module (Lead Finder) from a 100% search outage | One new `SearchProvider` implementation + one-line default swap; no architecture change | ~2-2.5 | None | 10 |
| 1.2 | **Re-run Phase 3 real-world validation suite** (the 4 test queries, originally blocked by the Google CSE outage) | Confirms Lead Finder is demo/sale-ready with real evidence before it's marketed | None — validation only, using the diagnostic harness pattern already built | ~1 | 1.1 | 9 |
| 1.3 | **Billing infrastructure** (Stripe or equivalent: checkout, webhooks, plan state on `Workspace`) | Without this, nothing on the platform can be charged for, regardless of quality | New: Stripe customer/subscription sync, a `workspace.plan` write path, webhook handler route | ~16-24 | None (parallelizable with 1.1/1.2) | 10 |
| 1.4 | **Enforce `PLAN_LIMITS` + add overage-credit path** | Turns the Hybrid model above from a doc into a real revenue mechanism | Add report-count tracking per workspace per billing period; gate `ResearchService.run()` calls behind plan check; add credit-purchase flow for overage | ~12-16 | 1.3 | 9 |
| 1.5 | **Make rate limiting and search quota plan-aware** (currently flat 5 req/hr/user and flat 100/day app-wide — the Google-CSE-specific version of this is being replaced in 1.1 anyway) | Prevents one tenant starving others as paid usage grows; protects margin per Hybrid model | Extend `lib/research/rate-limit.ts` and the renamed quota module to key off `workspaceId` + `plan`, not just a flat global/per-user number | ~6-8 | 1.1, 1.3 | 8 |

**Why this order:** 1.1 first because every other revenue task is moot if the core product can't run a search at all. 1.2 immediately after, because it's the cheapest possible confidence check before investing in billing for a feature that hasn't been validated end-to-end with real data since the engine was built. 1.3-1.5 can start in parallel with 1.1/1.2 (billing infra doesn't depend on the search provider), but should land before any paid-plan marketing claim is made.

### Priority 2 — Trust & Product Integrity

| # | Task | Business Impact | Technical Impact | Est. Hours | Dependencies | ROI |
|---|---|---|---|---|---|---|
| 2.1 | **Talent Finder: refactor or honestly reframe** | Protects Lead Finder's credibility by association — a customer who notices Talent Finder doesn't cite sources the way Lead Finder does may distrust both | Either wire it into `ResearchService` (real sourcing) or change UI copy/confidence framing to be explicit it's an AI estimate, not a sourced report | ~8 (reframe) to ~20 (full wire-in) | None | 7 |
| 2.2 | **Remove or replace the Market Intelligence iframe** | An externally-hosted page under your own "Intelligence" brand is a reputational liability with zero current upside | Take down the iframe page now; real replacement is Priority 5.3 | ~2 (removal only) | None | 7 |
| 2.3 | **Generate `types/supabase.types.ts` and remove `as any` casts from the active research pipeline** | Reduces the risk of a silent, type-system-invisible bug in the exact system that's about to start processing paid traffic | Mechanical: run Supabase's type generator, update query call sites in `app/api/research/*` and report read paths | ~6-10 | None | 8 |

### Priority 3 — Platform Hardening

| # | Task | Business Impact | Technical Impact | Est. Hours | Dependencies | ROI |
|---|---|---|---|---|---|---|
| 3.1 | **Review `demo_leads` permissive RLS policies** | Confirms the one intentionally-open hole in an otherwise RLS-locked schema isn't over-exposed | Audit + tighten Supabase policies on that table only | ~3 | None | 6 |
| 3.2 | **Decide and document Prisma-vs-Supabase persistence path forward** | Stops new features from being built on the "wrong" data layer by accident; reduces onboarding confusion | Either formally deprecate the unused Prisma `reports`/`api_usage` tables or define when each layer should be used going forward | ~4 (decision + doc) | None | 5 |

### Priority 4 — Code Health

| # | Task | Business Impact | Technical Impact | Est. Hours | Dependencies | ROI |
|---|---|---|---|---|---|---|
| 4.1 | **Resolve legacy AI engine's fate** (delete vs. keep archived) — revisit once Competitor/Supplier Intelligence (Priority 5) is actually scheduled | Low immediate impact; mostly a clarity/maintenance question | Delete `services/legacy-ai-engine/orchestrator.ts`, `prompt-builder.ts`'s dead exports, or formally document the archive decision with a revisit date | ~1-2 | Should follow, not precede, Priority 5 scoping | 3 |
| 4.2 | **Housekeeping cleanup**: delete `core/scoring/` (empty), `GOOGLE_CSE_DIAGNOSTIC.json`/`GOOGLE_PROJECT_DIAGNOSTIC.json` (closed investigation), the abandoned `GoogleCustomSearchProvider` class once 1.1 ships | Trivial; reduces repo clutter | Deletions only, already enumerated in `SERPAPI_MIGRATION_PLAN.md` §4 | ~0.5 | 1.1 | 4 |
| 4.3 | **Split `/api/intelligence/route.ts`** if/when it grows further (currently 1012 lines, cohesive, not urgent) | None today; pre-empts a harder refactor later | Extract per-report-type handlers if a 6th report type is ever added | Not yet scheduled — trigger-based, not date-based | 1 | n/a (deferred, not urgent) |

### Priority 5 — Future Expansion

| # | Task | Business Impact | Technical Impact | Est. Hours | Dependencies | ROI |
|---|---|---|---|---|---|---|
| 5.1 | **Competitor Intelligence** (real, Research-Core-Engine-backed) | New sellable module, same engine as Lead Finder — incremental revenue surface without a new architecture | New query-shape + prompts on top of existing `ResearchService`; UI for the existing "Coming Soon" placeholder | ~24-32 | 1.1-1.5 stable in production (don't add search load before there's a way to charge for it) | 6 |
| 5.2 | **Supplier Intelligence** (same pattern as 5.1) | Same rationale as 5.1, weaker evidence of demand in this review — sequence after | Same engine, different query shape/prompts | ~24-32 | 5.1 should land first to validate the "new module on existing engine" pattern once | 5 |
| 5.3 | **Real Market Intelligence module** (replacement for the removed iframe) | Restores the feature with substance instead of a liability | Likely the same Research Core Engine pattern again, or a curated-data approach if the query shape doesn't fit search-based research well | ~16-24 (engine-based) | 2.2 (removal first), 1.1-1.5 stable | 5 |

---

## Sequencing Summary

```
P1: SerpAPI migration → validate → billing infra → enforce plans → plan-aware limits
P2: (parallel with P1) Talent Finder honesty fix, kill the MI iframe, Supabase types
P3: (parallel, lower urgency) demo_leads RLS review, Prisma/Supabase decision
P4: (opportunistic) dead-code cleanup, deferred file-split watch
P5: (only after P1 is stable in production) Competitor → Supplier → real Market Intelligence
```

The throughline: **fix the one broken revenue-critical thing first (P1.1-1.2), build the ability to charge money second (P1.3-1.5), protect trust in what already works third (P2), then and only then expand the product surface (P5).** Every item above is documentation/planning only — none of it should be implemented until this plan, `FINAL_PLATFORM_AUDIT.md`, and `SERPAPI_MIGRATION_PLAN.md` are reviewed and explicitly approved.
