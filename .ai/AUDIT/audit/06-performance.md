# 06 — Performance

**Evidence basis:** API route code, caching implementation, Next.js config, dependency analysis.

---

## Summary

The platform's performance profile is dominated by two external latency sources: **OpenAI GPT-4o-mini** (1–4 seconds per call) and **SerpAPI** (0.5–2 seconds per query). Internal compute and database latency is negligible by comparison. A Redis caching layer exists but has limited scope.

---

## API Route Performance Analysis

### `/api/intelligence` — Real Estate Reports

| Factor | Detail |
|---|---|
| OpenAI call | Single GPT-4o-mini call, `max_tokens: 4000`, `temperature: 0.3` |
| Typical latency | 3–8 seconds end-to-end |
| Caching | None (every call re-invokes OpenAI) |
| Redis rate limit | Adds ~1 Redis GET + 1 SET per call (Upstash REST: ~5ms each) |
| Plan check | 2 Supabase queries (~20ms each) |
| DB write | 2 Supabase inserts (research_requests + reports) — not on critical path |
| **Bottleneck** | OpenAI response time |

**Finding:** No response caching for intelligence reports. Identical queries (same company, same inputs) re-spend OpenAI tokens every time. For the feasibility report specifically, the deterministic `calculateCashflow` engine means the numbers are always the same for the same inputs — only the AI narrative varies. A cache on the prompt hash would save cost and latency.

**File:** `app/api/intelligence/route.ts:996–1010`

---

### `/api/research/leads` — Lead Finder

| Factor | Detail |
|---|---|
| SerpAPI call | 1 search query, up to 10 results |
| Source fetching | Up to 10 concurrent HTTP GETs (via `Promise.all`) |
| Company Expansion | Additional HTTP GETs for discovered domains |
| OpenAI call | 1 GPT-4o-mini call for AI analysis of ranked sources |
| Apollo enrichment | Optional — 0 to N calls per result |
| Redis cache | SHA-256 hash of query params → 24h TTL |
| Total typical latency | 5–15 seconds (varies heavily with source fetch success) |
| **Bottleneck** | Parallel source fetching (network I/O to external domains) |

**Evidence:** `lib/research/acquisition/research-service.ts:176–196` — `Promise.all()` for both initial and expansion fetches.

**Finding:** Source fetching uses `Promise.all` (concurrent, correct). However, each source URL is fetched with a full HTTP GET with no timeout guard. A slow or hung domain can hold the entire Promise.all until Node.js eventually times out. No per-request timeout is set on the fetch calls.

**Recommendation:** Add `AbortController` with a 5-second timeout on each `sourceCollector.collect()` call.

---

### `/api/research/talent` — Talent Finder

| Factor | Detail |
|---|---|
| OpenAI call | 1 GPT-4o-mini call, `max_tokens: 2500` |
| Caching | None |
| Typical latency | 2–5 seconds |

---

## Caching Layer Analysis

**File:** `lib/redis/cache.ts`  
**Redis backend:** Upstash REST API (Serverless-compatible, ~5ms per operation)

```typescript
export const CACHE_TTL = {
  REPORT: 24 * 60 * 60, // 24 hours
}
```

**What is cached:**
- Research Core Engine results (Lead Finder queries) — keyed by SHA-256 hash of query params excluding `userId` — so the same query from different users hits the same cache entry. ✅

**What is NOT cached:**
- Intelligence reports (Real Estate Engine) — every call re-invokes OpenAI
- Talent Finder results — no caching implemented

**Impact:** An identical Lead Finder query from the same or different user within 24 hours saves ~$0.005 OpenAI cost + 5–15 seconds latency. Intelligence reports have no such protection.

**Recommendation:** Implement prompt-hash caching for intelligence reports (at least feasibility, which is fully deterministic).

---

## Database Performance

**Supabase:**
- All research tables have `user_id` indexes (`research_requests_user_id_idx`)
- Reports table queried by `user_id` on dashboard — should have index (not confirmed in SQL files reviewed)
- Dashboard page loads 3 concurrent Supabase queries (`Promise.all` at `app/dashboard/page.tsx:36`) — ✅ correct

**Prisma:**
- Workspace query (`app/api/workspace/route.ts`) does 1 Prisma query with `include: { workspace: { include: { users, _count } } }` — N+1 is not a risk here (single record lookup with explicit includes)

---

## Frontend Performance

**Bundle concerns:**
- `framer-motion` is declared as a dependency but usage is limited to `components/motion/fade-in.tsx` — adds ~30KB gzipped to the bundle for minimal usage
- Inline `<style>` tags with extensive CSS are used in every major page (real-estate, leads, talent, reports) rather than CSS modules or Tailwind utilities — results in per-page style duplication and no stylesheet caching

**Next.js:**
- `serverExternalPackages: ['@prisma/client', 'prisma']` correctly prevents Prisma from being bundled — ✅
- No Image component optimization concerns beyond the wildcard `hostname: '**'` pattern

**Loading states:**
- All API calls show loading states correctly (spinners, disabled buttons)
- No skeleton screens on dashboard initial load (Supabase queries are server-side, so data is present on first paint — ✅)

---

## Performance Risk Summary

| Risk | Severity | Impact |
|---|---|---|
| No caching for intelligence reports | HIGH | Cost + UX (8s re-fetch of identical query) |
| No timeout on source URL fetches | MEDIUM | Lead Finder could hang 30+ seconds on slow domain |
| Resend declared but unused | LOW | Dead dependency weight |
| Inline CSS duplication | LOW | ~5–10KB extra per page, no cache benefit |
| framer-motion for 1 component | LOW | ~30KB bundle overhead |
