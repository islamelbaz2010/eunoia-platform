# Backend Audit

**Score: 62 / 100**

---

## Research Core Engine (Best-Implemented Subsystem)

**Location:** `lib/research/`, `lib/research/acquisition/`

The most architecturally sound part of the codebase — a well-structured, single-responsibility pipeline with real tests.

### Pipeline: Search → Collect → Validate → Dedup → Rank → Enrich → AI Analyze

```
ResearchService.run()
  │
  ├─ [1] SerpApiProvider.search(query)         — SerpAPI REST call
  │       └─ checkSearchQuota(userId)           — Redis per-user + global daily budget
  │
  ├─ [2] Promise.all(collectAndVet(results))   — Parallel HTTP fetch per result
  │       ├─ isParkedDomainProvider()           — blocklist check
  │       ├─ getSourceReputation()              — Redis suppression check
  │       ├─ FetchSourceCollector.collect()     — HTTP GET + text extraction
  │       └─ detectBrokenPage()                — soft-404 detection
  │
  ├─ [3] extractMentionedDomains()             — Company Expansion (directory mining)
  │       └─ collectAndVet() on new domains
  │
  ├─ [4] normalizeSources()                    — CollectedItems → NormalizedSource
  ├─ [5] filterValidSources()                  — Company Validation
  ├─ [6] dedupeCompanies()                     — Cross-domain dedup
  ├─ [7] rankSources()                         — Scoring by sector/city/size hints
  ├─ [8] applyApolloEnrichmentStep()           — Optional Apollo.io enrichment
  └─ [9] analyzeRankedSources()                — OpenAI AI analysis (direct)
```

**Strengths:**
- Each step is a separate, testable function in its own module
- 109 tests covering the key algorithmic steps
- Fail-open pattern throughout Redis/quota checks
- Cache keyed by query hash (not userId) — shared results across users for identical queries
- Apollo enrichment is truly optional — no-ops gracefully when API key absent
- `ResearchResultSchema.safeParse()` on cache hits — validates schema before returning stale data

**Issues:**
- `source-collector.ts` does `await fetch(url)` with no timeout — can hang on slow servers
- Company Expansion creates additional fetch calls per result — up to 2× the network calls
- `ResearchService` singleton is module-level — correct for serverless (new per cold start)

---

## Real Estate Intelligence Route

**Location:** `app/api/intelligence/route.ts` (1051 lines)

**Strengths:**
- Pre-AI cashflow calculation engine (NPV, ROI, payback) produces real numbers before the AI prompt
- Egypt-specific market benchmarks (CPL ranges, decision cycles, margins, city multipliers)
- Plan limit + rate limit checks at route entry
- Report saved to Supabase `reports` table after generation

**Issues:**
- **1051 lines in a single route file.** All business logic (cashflow engine, prompt construction, benchmark data, AI call, parsing, DB write) in one handler. Zero separation of concerns.
- AI inference routed through `halannews.com/api-proxy` (SEC-02)
- No streaming — user waits synchronously for full AI response. High timeout risk.
- Hardcoded benchmark data in the route file — should be a data layer

---

## Legacy AI Engine

**Location:** `services/legacy-ai-engine/`

**Status: DEAD — correctly documented in README**

| File | Purpose | Status |
|---|---|---|
| `orchestrator.ts` | Report generation pipeline | ❌ Dead — no live callers |
| `prompt-builder.ts` | Report type → prompt dispatch | ❌ Dead |
| `prompts/*.prompt.ts` (30 files) | Report-type prompts | ❌ Dead |
| `providers/openai.provider.ts` | OpenAI wrapper | ✅ **ALIVE** — imported by research engine |
| `providers/base.provider.ts` | AIProvider interface | ✅ **ALIVE** — research engine uses this interface |

**Critical note:** The `OpenAIProvider` from `services/legacy-ai-engine/providers/openai.provider.ts` IS actively imported by `lib/research/acquisition/research-service.ts`. The orchestrator+prompts are dead; the provider is alive. **`services/` cannot be fully deleted — only the dead files.**

---

## Redis / Caching Layer

**Location:** `lib/redis/client.ts`, `lib/redis/cache.ts`

**Correct patterns:**
- Lazy singleton (`getRedis()` called only when needed)
- HTTP-based Redis client (Upstash) — no persistent TCP connections in serverless
- All cache operations swallow errors (fail-open, non-fatal)

**Issues:**
- `cacheDel` and `cacheGetOrSet` are exported from `cache.ts` but never imported anywhere — dead exports
- No TTL on plan tier lookups — 2 uncached Supabase queries per research request

---

## Rate Limiting — Three Independent Layers

| Layer | Implementation | Limit | Key | Fail-open? |
|---|---|---|---|---|
| Per-user hourly | `lib/research/rate-limit.ts` | 5 req/hr | `ratelimit:research:*:userId` | ✅ |
| Per-user daily search | `lib/research/acquisition/quota.ts` | 30 searches/day | `quota:search-provider:user:userId:date` | ✅ |
| Global daily search | `lib/research/acquisition/quota.ts` | 150 searches/day | `quota:search-provider:date` | ✅ |

**Correct:** Per-user checked before global — prevents one tenant exhausting the shared budget.

**Issue:** `incr()` then separate `expire()` calls — non-atomic. A crash between the two leaves a key with no TTL (builds up forever). Fix: use `SET key 1 EX window NX` for first-write atomicity, or always `incr()` then conditionally `expire()` if count === 1.

---

## Plan Enforcement

**Location:** `lib/research/plan-enforcement.ts`

Correctly reads from `user_plans`, sums `research_requests.credits_used` for current month, enforces `PLAN_LIMITS`.

**Issues:**
- `supabase as any` cast — stale generated types
- Falls back to STARTER + `ok: true` on any Supabase error — intentional fail-open (Supabase outage = unlimited access)
- No caching — 2 sequential Supabase queries per research request
- `startOfMonthISO()` uses `new Date()` without explicit timezone. Consistent (UTC throughout), but undocumented.

---

## Auth Flow

**Three independent layers (defense-in-depth):**
1. `proxy.ts` — middleware: refresh Supabase session, redirect `/dashboard` if no user (FAIL-OPEN on missing env/exception)
2. `app/dashboard/layout.tsx` — server: independent `getUser()` re-check, Prisma user existence check
3. Individual API routes — each calls `supabase.auth.getUser()` independently

**Issue:** Up to 3 Supabase auth network calls per dashboard API request (middleware + layout + route). Vercel Edge should cache within a single request, but worth measuring.

---

## Background Jobs / Queue / Cron

**Finding: None exist.**

`research_requests.status` enum (`submitted`/`processing`/`completed`/`failed`) suggests a queue design was planned. The SQL comment confirms Phase 1 is synchronous; a real queue "can be slotted in later." 

**Current risk:** Long-running research requests (SerpAPI + HTTP collection + AI) can approach Vercel's timeout boundary. Mitigated by `maxResults` cap (10), but still risk on slow networks.

---

## `lib/csv-export.ts` [ACTIVE — Confirmed]

Imported by both `app/dashboard/research/leads/page.tsx:7` and `app/dashboard/research/talent/page.tsx:6`. Not dead code. Provides CSV download of research results.

---

## `next-intl` Status [CONFIRMED NEAR-DEAD]

`i18n/request.ts` returns `{ locale: 'en', messages: {} }` — hardcoded English with empty message object. No `getTranslations()` or `useTranslations()` calls found in any page. The package is installed and configured in `next.config.ts` but produces no actual localization. Effectively dead weight at this stage.

---

## Error Handling Patterns

| Pattern | Used | Correct |
|---|---|---|
| Typed error returns `{ error: string }` | ✅ | ✅ |
| Try/catch wrapping all async operations | ✅ | ✅ |
| Fail-open on Redis unavailability | ✅ | ✅ (documented) |
| Fail-open on Supabase errors in plan enforcement | ✅ | ⚠️ (unlimited access during outage) |
| `console.error` for operational errors | ✅ | ⚠️ (no structured logging; not searchable in production) |
| Error boundary in dashboard | ✅ (`app/dashboard/error.tsx`) | ✅ |
