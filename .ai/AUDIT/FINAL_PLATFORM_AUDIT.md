# Final Platform Audit — Eunoia Intelligence Platform

**Date:** 2026-06-18
**Author:** Claude (acting as CTO / Principal Architect for this review)
**Scope:** Full architecture, module-completeness, technical-debt, revenue, scalability and security review, ordered before the SerpAPI migration and before any further feature build-out.
**Status:** Documentation only. No code was modified to produce this report.

This document supersedes nothing already written (`PROJECT_AUDIT.md`, `RESEARCH_ASSET_AUDIT.md`, `RESEARCH_DATA_LAYER_DESIGN.md`, `RESEARCH_CORE_ENGINE_PHASE1.md`, `RESEARCH_CORE_ENGINE_PHASE2.md`) — it consolidates them, adds what changed since (the Google CSE failure and abandonment), and adds the business-facing analysis (revenue, product, scalability, security) those documents didn't cover.

---

## 1. Current Architecture

**Stack:** Next.js 16.2.6 (App Router), React 19, TypeScript 5.8, Tailwind 4. Deployed target: Vercel (implied by `CLOUDFLARE_WORKER_URL` fallback and Next.js conventions; no deployment config was inspected as part of this review).

**Data layer — two parallel systems that don't talk to each other:**

| | Prisma / PostgreSQL | Supabase (raw client) |
|---|---|---|
| Tables | `users`, `workspaces`, `reports` (legacy/unused), `api_usage` (legacy/unused) | `research_requests`, `reports` (active), `demo_leads` |
| Used by | Auth/workspace scaffolding, legacy report quota concept | The entire live Research Core Engine + dashboard |
| Typed? | Yes, via Prisma Client | No — queried `as any`, because `types/supabase.types.ts` is an unfilled stub |
| RLS | Yes, via `get_user_workspace_id()` + `workspace_isolation` policies | Yes, `auth.uid() = user_id` policies; `demo_leads` has permissive service-role policies for public capture |

This is the single biggest structural inconsistency in the codebase: **the active product bypasses the ORM entirely.** Every new feature built on Supabase tables inherits zero compile-time safety until `types/supabase.types.ts` is generated and wired in.

**Research Core Engine (`lib/research/acquisition/`)** — the one well-built subsystem in the platform. Six-layer pipeline, orchestrated by `ResearchService.run()`:

```
SearchProvider → SourceCollector → Normalizer → Ranker → AIAnalysis → ResearchResult (Zod-validated)
```

- `search-provider.ts` — `GoogleCustomSearchProvider`, the only implementation, now non-functional (see §4).
- `source-collector.ts` — `FetchSourceCollector`: 8s timeout, 500KB cap, hand-rolled HTML→text, fail-closed (`null` on any error). Never fetches LinkedIn/Facebook/Instagram/Twitter/X (classified `public_listing` instead).
- `normalizer.ts` — dedupes by domain, maps text onto `core/data/sectors.data.ts` / `cities.data.ts` taxonomy via substring match.
- `ranker.ts` — fully deterministic confidence score (40 base + source-type bonus + sector/city match + content-depth bonus, capped 95). No AI involved — this is why scores are reproducible and explainable.
- `ai-analysis.ts` — AI only *summarizes* the closed list of already-ranked sources; on any provider failure it falls back to a raw text excerpt rather than inventing or dropping data. This "pre-compute in JS, AI only interprets" pattern is the platform's strongest anti-hallucination safeguard, also used independently in the Real Estate Intelligence route.
- `research-service.ts` — orchestrator; lazily constructs the AI provider so a missing `OPENAI_API_KEY` surfaces a clear error instead of crashing the singleton; caches results 24h by SHA-256 of the input.
- `quota.ts` — Google-CSE-specific shared 100/day counter, fails open if Redis is unavailable.

**Legacy AI Engine (`services/legacy-ai-engine/`)** — a complete, parallel orchestration system (`orchestrator.ts`, `prompt-builder.ts`, 30 `*.prompt.ts` templates, `providers/openai.provider.ts`) with its own rate limiter and its own Redis cache, confirmed by direct grep to have **zero inbound callers from any active route**. The Research Core Engine imports only two leaf files from it (`base.provider.ts`'s `AIProvider` interface, `openai.provider.ts`'s `OpenAIProvider` class) as a dependency-injection base — it does not use the orchestrator, the prompt-builder, or any of the 30 prompt templates. The engine's own `README.md` already documents this as an intentional archive for future Competitor/Supplier Intelligence work.

**Other modules:**
- Real Estate Intelligence (`/api/intelligence`, 1012 lines) — fully independent of the Research Core Engine; pre-computes NPV/IRR/cashflow in JS, then prompts OpenAI with "use these EXACT numbers." 5 report types. The largest single route file in the repo.
- Talent Finder (`/api/research/talent`) — has its own inline `buildPrompt()` and does **not** call `getResearchService()` — it's pure OpenAI generation with no search/source-collection/ranking, dressed in the same UI shell as Lead Finder, with an explicit AI-disclaimer in the copy.
- Market Intelligence — `/dashboard/analytics` is static curated text; `/market-intelligence` is an iframe embedding an external site (`halannews.com`). Neither does research.
- Competitor Intelligence / Supplier Intelligence — not implemented. "Coming Soon" placeholders on `/dashboard/research`.

---

## 2. Module Status

| Module | Status | Evidence |
|---|---|---|
| **Lead Finder** | ✅ Working, real | Full Research Core Engine path: live search → fetch → normalize → rank → AI summarize → Zod-validated output |
| **Talent Finder** | ⚠️ Working, but not what it claims to be | Same UI/UX as Lead Finder; backend is a single OpenAI prompt, no search or sourcing. Confidence score (`computeConfidence()` in `lib/research/sources.ts`) measures *input form completeness*, not result quality |
| **Real Estate Intelligence** | ✅ Working, real | Pre-computed financial modeling (NPV/IRR/cashflow) + OpenAI narrative. Independent stack, well-isolated |
| **Market Intelligence** | ❌ Not real | Static text page + iframe of a third-party site. No data pipeline |
| **Competitor Intelligence** | ❌ Not built | UI placeholder only |
| **Supplier Intelligence** | ❌ Not built | UI placeholder only |
| **Legacy AI Engine / 30 report types** | 🗃️ Archived, unreachable | Confirmed zero callers; intentionally kept per its own README |

**Broken right now:**
- `GoogleCustomSearchProvider` — the *only* `SearchProvider` implementation — returns `403 PERMISSION_DENIED` on every request, on every endpoint variant tested, across many retries over several days. This is a 100% outage of Lead Finder's search step (Talent Finder is unaffected since it never calls `ResearchService`). Root cause was being chased at the GCP-project level when the business decided to abandon Google CSE outright in favor of SerpAPI — see `SERPAPI_MIGRATION_PLAN.md`.

---

## 3. Dead Code & Duplication

**Confirmed dead (zero inbound references from any active route):**
- `services/legacy-ai-engine/orchestrator.ts` — `ReportOrchestrator` class, `getOrchestrator()` singleton.
- `services/legacy-ai-engine/prompt-builder.ts` — `REPORT_TYPE_LABELS`, `buildPromptForType()`, `isValidReportType()`.
- `services/legacy-ai-engine/prompts/*.prompt.ts` — all 30 files, reachable only through the dead `prompt-builder.ts`.
- `core/scoring/` — empty directory, no files.

**Not dead, but should be watched:**
- Prisma's `reports` and `api_usage` tables — superseded by the Supabase-side `reports` table for the active product; not confirmed unused by *every* code path, but no longer the active write target for research output.

**Duplication that looks worse than it is** (three separate "confidence score" concepts, two rate-limiters, two cache layers) — on inspection these operate at different layers and don't conflict:
- `ranker.ts::rankSources()` scores *individual sources* deterministically (taxonomy + content depth).
- `lib/research/sources.ts::computeConfidence()` scores *input completeness* for Talent Finder.
- `app/api/research/leads/route.ts::aggregateConfidence()` averages already-scored items into one report-level number.
- The legacy engine's rate limiter and cache are dead code (see above), so there is really only one *active* instance of each, not two competing live systems.

This is the one place this audit disagrees with treating it as urgent debt: it reads as duplication on a file listing, but a careful read shows no behavioral conflict. Lower priority than the items below.

**Real duplication that does matter:** none found at the level of competing business logic. The legacy engine being dead, rather than competing, is the correct characterization.

---

## 4. Technical Debt — Ranked

1. **Search provider total outage (Google CSE).** Highest priority — it's the spine of Lead Finder, the platform's only fully-working revenue-relevant module. Addressed by `SERPAPI_MIGRATION_PLAN.md`.
2. **No monetization enforcement.** `Workspace.plan` and `PLAN_LIMITS` (`types/workspace.types.ts`: Starter 20 reports/mo + 2 members, Professional 100/mo + 10, Enterprise unlimited) exist as types only. There is no Stripe/Paddle/PayPal package in `package.json`, no billing route, no plan-aware enforcement anywhere in the code. Rate limiting (`lib/research/rate-limit.ts`, flat 5 req/hr/user) and the Google CSE quota (flat 100/day, app-wide) are both flat, not plan-aware — a paying Enterprise customer and a free user currently get the identical limit. **This is a revenue-blocking gap, not a code-quality one** — see §6.
3. **Supabase queried `as any` throughout the active pipeline.** `types/supabase.types.ts` is an unfilled stub. Every Supabase read/write in the live product has zero compile-time type safety. One schema migration away from a silent runtime bug that `tsc --noEmit` will never catch.
4. **Two parallel persistence systems** (Prisma vs. raw Supabase client) with no migration path documented between them. New engineers will not know which one to extend by default.
5. **Talent Finder's product framing doesn't match its implementation.** It's presented identically to Lead Finder (same UI, same "confidence score" framing) but does no search/sourcing — this is a trust/credibility risk if a customer compares the two outputs and notices Lead Finder cites sources and Talent Finder doesn't.
6. **`/api/intelligence/route.ts` at 1012 lines.** Not urgent — it's cohesive (5 related report types sharing financial primitives) — but it's the largest single file in the repo and the next feature added there should trigger a split, not be the thing that finally forces one.
7. **Legacy AI engine retained with no expiry decision.** Reasonable to keep (30 prompt templates are real, reusable scaffolding for Competitor/Supplier Intelligence) but there's no tracked decision date. Recommend: revisit when Competitor or Supplier Intelligence is actually scheduled (see `MASTER_EXECUTION_PLAN.md`); if neither ships within two quarters, archive to a branch.
8. **`core/scoring/` empty directory.** Trivial, delete whenever convenient — bundled into the migration plan's cleanup list rather than treated as its own task.

---

## 5. Revenue Impact Analysis

The platform's only commercially defensible asset today is the Research Core Engine behind Lead Finder — it's the one module that does real, source-cited, evidence-graded work no generic ChatGPT wrapper can trivially replicate (search → fetch → dedupe → deterministic rank → grounded summarize). That asset has been at **100% functional outage** for its search step since Google CSE started failing. Every day that continues is a day the platform's flagship feature cannot be demoed or sold credibly.

Beyond the outage, the absence of any billing infrastructure means **the platform currently has no mechanism to charge anyone**, regardless of how good Lead Finder's output is. Plan tiers exist as decoration. This is addressed as Priority 1 in `MASTER_EXECUTION_PLAN.md` and analyzed in the revenue-model review below (§7).

Talent Finder, Market Intelligence, Competitor Intelligence, and Supplier Intelligence carry near-zero revenue weight today: three of the four either don't function as advertised or don't exist. They matter for the roadmap (§ product review, below) but not for current revenue.

---

## 6. Scalability Analysis

**What scales fine as-is:**
- Redis-backed caching (24h TTL, SHA-256 keyed) means repeat queries don't re-spend search-provider quota or AI tokens — this was specifically engineered into the Research Core Engine and it works.
- Fail-open design on Redis (cache, rate-limit, quota all degrade to "allow" if Redis is unreachable) means a Redis outage doesn't take down the product, only its cost controls — acceptable trade-off at current scale, worth revisiting once paid plans exist (a Redis outage during a billing-enforced period means free unlimited usage for everyone, briefly).
- `SourceCollector`'s hard caps (8s timeout, 500KB body) bound worst-case latency and memory per source fetch regardless of traffic volume.

**What will not scale:**
- The flat, app-wide 100/day search quota and flat 5/hr per-user rate limit are sized for a pre-launch/demo phase. They are not plan-aware and have no per-workspace dimension — a single Enterprise customer running normal usage could starve every other tenant once there's more than a handful of active accounts. This must be redesigned alongside billing, not after it (see `MASTER_EXECUTION_PLAN.md` Priority 1).
- `SourceCollector` fetches are sequential per result inside a single `Promise.all` per query — fine at today's volume (≤10 results/query), but there's no shared rate limiting across concurrent users hitting the same target domains, which could trigger external sites' own bot-defenses at higher concurrency.
- No queueing/job system exists for long-running report generation — every research run is a synchronous request/response inside a single API route. Acceptable for sub-10-second runs today; will need a job queue if report scope grows (e.g., 50+ sources, deep crawling).

**Overall:** the core engine's *architecture* (provider interfaces, caching, fail-closed source collection) scales conceptually fine. The *controls around it* (quota, rate limits) are the part sized for a demo, not a multi-tenant paid product, and should be revisited in the same pass as billing.

---

## 7. Security Analysis

**Good practices already in place:**
- RLS enforced on both persistence layers (`get_user_workspace_id()`-based policies on Prisma-side tables; `auth.uid() = user_id` on Supabase-side `research_requests`/`reports`).
- Secrets handled correctly in this engagement: real API keys were written only to `.env.local` (gitignored, confirmed untracked, never committed).
- Source collection is fail-closed and bounded (timeout + size cap), reducing SSRF/resource-exhaustion blast radius from fetching arbitrary external URLs returned by search.
- AI summarization never invents data when the provider fails — reduces hallucination-driven trust/legal risk in a product whose value proposition is evidence-backed research.

**Gaps / risks:**
- `demo_leads` table uses permissive service-role policies "for public demo capture" — worth a deliberate review of exactly what's exposed to unauthenticated traffic through that path, since it's the one intentionally-open hole in an otherwise RLS-locked schema.
- Supabase queries cast `as any` throughout the active pipeline means a future schema change could silently widen or narrow exposed fields without the type system ever flagging it — a security-relevant consequence of the type-safety gap noted in §4.
- No billing/plan enforcement (§4, §6) is also a security-adjacent abuse-control gap: without plan-aware limits, a single compromised or abusive account can consume the entire shared resource budget (Redis quota aside, there's no per-tenant ceiling once a real search provider is paying per call).
- `SourceCollector`'s `NO_FETCH_DOMAINS` allowlist-by-exclusion (skip LinkedIn/Facebook/Instagram/Twitter/X) is a reasonable ToS-respecting default, but it's a hardcoded list, not a policy — worth turning into a documented, reviewable config if more domains need to be excluded as the product scales.

No critical vulnerabilities (injection, auth bypass, secret leakage in code) were found in the modules reviewed. The risk profile here is mostly about **abuse/cost-control maturity**, not classic OWASP-style vulnerabilities.

---

## 8. Product Review — Keep / Refactor / Remove / Postpone

| Module | Decision | Reasoning |
|---|---|---|
| **Lead Finder** | **KEEP** | Only fully real, evidence-based module. Fix its search provider (SerpAPI migration) and it's sellable today. |
| **Talent Finder** | **REFACTOR** | The engine behind it isn't broken, it's just not the Research Core Engine. Either (a) wire it into `ResearchService` like Lead Finder so it does real sourcing, or (b) keep it as pure-AI estimation but change the UI framing so it's honestly positioned as an estimate, not a sourced report. Shipping it unchanged risks a customer noticing the inconsistency with Lead Finder and losing trust in both. |
| **Real Estate Intelligence** | **KEEP** | Independently solid: pre-computed financial modeling + grounded AI narrative, 5 report types, already complete. No changes needed for this audit's purposes. |
| **Market Intelligence** | **REMOVE or POSTPONE** (recommend REMOVE the iframe page now, POSTPONE a real version) | An iframe of a third-party site under your own "Intelligence" branding is a liability if that content is ever wrong, offensive, or simply down — it's not your content and you don't control it. Either replace with a real Research-Core-Engine-backed module later, or take it down now and re-add the nav item only once there's substance behind it. |
| **Competitor Intelligence** | **POSTPONE** | Architecturally this is the same shape as Lead Finder (search → collect → rank → summarize) — the Research Core Engine can support it with new prompts/sector logic, not a rewrite. Sequenced in `MASTER_EXECUTION_PLAN.md` after the SerpAPI migration is stable and billing exists, since it adds search-provider load before there's a way to charge for it. |
| **Supplier Intelligence** | **POSTPONE** | Same reasoning as Competitor Intelligence — same engine, different query shape. Lower priority than Competitor Intelligence: weaker evidence in this review of distinct customer demand, sequence it after. |

---

## 9. What This Audit Deliberately Does Not Re-litigate

- The Google Custom Search root cause. Per explicit instruction, this is now closed as **FAILED/ABANDONED** and is not re-investigated here — it appears only as the trigger for §4 item 1 and the migration plan.
- Anything already settled in `RESEARCH_CORE_ENGINE_PHASE1.md` / `PHASE2.md` about the engine's internal design — those decisions stand; this audit treats them as the foundation, not something to second-guess.

---

## 10. Inputs to This Audit

Synthesized from: direct reading of `lib/research/acquisition/*` (all 8 files), `services/legacy-ai-engine/` (orchestrator, prompt-builder, providers, prompts directory), `lib/redis/*`, `types/workspace.types.ts`, `package.json`, `.env.example` / `.env.local.example`, `app/api/research/leads/route.ts`, plus four prior research passes covering Supabase/Prisma schema and RLS policies, module-by-module UI/route inspection (Talent Finder, Real Estate Intelligence, Market Intelligence, Competitor/Supplier placeholders), monetization infrastructure search, and a dedicated dead-code/duplication sweep of `services/legacy-ai-engine/`, `/lib/`, and `/core/`.

See companion documents: `SERPAPI_MIGRATION_PLAN.md` (technical fix for §4 item 1) and `MASTER_EXECUTION_PLAN.md` (sequencing for every item raised above, including the revenue-model decision).
